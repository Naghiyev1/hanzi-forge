import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const vocabPath = path.join(root, 'src', 'data', 'generated', 'hsk-vocab-data.ts')
const characterPath = path.join(root, 'src', 'data', 'generated', 'hsk-character-data.ts')
const reportPath = path.join(root, 'src', 'data', 'generated', 'hsk-quality-report.json')

const EXPECTED = {
  '1': { entries: 300, characters: 137, words: 163 },
  '2': { entries: 200, characters: 84, words: 116 },
  '3': { entries: 500, characters: 134, words: 366 },
  '4': { entries: 1000, characters: 210, words: 790 },
  '5': { entries: 1600, characters: 266, words: 1334 },
  '6': { entries: 1800, characters: 252, words: 1548 },
  '7-9': { entries: 5600, characters: 512, words: 5088 },
}

function readArray(filePath, exportNames) {
  const source = fs.readFileSync(filePath, 'utf8')
  const exportPattern = exportNames.join('|')
  const match = source.match(new RegExp(`export\\s+const\\s+(${exportPattern})[^=]*=\\s*(\\[[\\s\\S]*\\])\\s*;?\\s*$`))
  if (!match) {
    throw new Error(`Could not find exported array in ${filePath}. Expected one of: ${exportNames.join(', ')}`)
  }
  try {
    return { exportName: match[1], data: JSON.parse(match[2]) }
  } catch (error) {
    throw new Error(`Could not parse JSON array in ${filePath}: ${error.message}`)
  }
}

function writeArray(filePath, importType, exportName, data) {
  const output = `// @ts-nocheck\nimport type { ${importType} } from '../types'\n\nexport const ${exportName}: ${importType}[] = ${JSON.stringify(data, null, 2)}\n`
  fs.writeFileSync(filePath, output, 'utf8')
}

function normalizeLevel(level) {
  const value = String(level ?? '').trim()
  if (value === '7' || value === '8' || value === '9' || value === '7-9') return '7-9'
  return value
}

function stripLineMarkers(value) {
  return String(value ?? '')
    .replace(/\n?L\d+:\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const POS_PREFIX_RE = /^((?:n|v|adj|adv|prep|conj|pron|num|mw|part|pref|suf|interj|onom|idiom|expr)\.(?:\/(?:n|v|adj|adv|prep|conj|pron|num|mw|part|pref|suf|interj|onom|idiom|expr)\.)*)\s+(.+)$/i

function cleanVocabEntry(entry) {
  const next = { ...entry }
  let fixes = 0

  next.level = normalizeLevel(next.level)
  next.word = stripLineMarkers(next.word)
  next.pinyin = stripLineMarkers(next.pinyin)
  next.pos = stripLineMarkers(next.pos)
  next.definition = stripLineMarkers(next.definition)
  if (next.also) next.also = stripLineMarkers(next.also)

  if (!next.definition && next.pos) {
    const match = next.pos.match(POS_PREFIX_RE)
    if (match) {
      next.pos = match[1]
      next.definition = match[2]
      fixes += 1
    }
  }

  const posLeak = next.pos.match(POS_PREFIX_RE)
  if (next.definition && posLeak && next.pos.length > 20) {
    next.pos = posLeak[1]
    next.definition = `${posLeak[2]} ${next.definition}`.replace(/\s+/g, ' ').trim()
    fixes += 1
  }

  if (next.pos === 'mw./') {
    next.pos = 'mw.'
    next.definition = next.definition.replace(/^\)\s*/, '')
    fixes += 1
  }

  return { entry: next, fixes }
}

function isSingleChineseCharacter(word) {
  return /^[\u3400-\u9FFF]$/.test(String(word ?? '').trim())
}

const vocabRead = readArray(vocabPath, ['HSK_VOCAB', 'HSK_VOCAB_DATA'])
const charRead = readArray(characterPath, ['HSK_CHARACTER_DATA', 'HSK_CHARACTERS'])

let fixedDefinitionLeaks = 0
const vocab = vocabRead.data.map((entry) => {
  const cleaned = cleanVocabEntry(entry)
  fixedDefinitionLeaks += cleaned.fixes
  return cleaned.entry
})

const characters = charRead.data.map((entry) => ({
  ...entry,
  level: normalizeLevel(entry.level),
  character: stripLineMarkers(entry.character),
  pinyin: stripLineMarkers(entry.pinyin),
  definition: stripLineMarkers(entry.definition),
}))

const summary = {}
const suspicious = {
  emptyDefinitions: [],
  suspiciousPos: [],
  splitMismatches: [],
}

for (const level of Object.keys(EXPECTED)) {
  const rows = vocab.filter((entry) => normalizeLevel(entry.level) === level)
  const characterRows = rows.filter((entry) => isSingleChineseCharacter(entry.word)).length
  const wordRows = rows.length - characterRows
  const expected = EXPECTED[level]

  let status = 'ok'
  if (rows.length !== expected.entries) status = 'entries-mismatch'
  else if (characterRows !== expected.characters || wordRows !== expected.words) status = 'split-needs-review'

  summary[level] = {
    entries: rows.length,
    expectedEntries: expected.entries,
    characterRows,
    expectedCharacters: expected.characters,
    wordRows,
    expectedWords: expected.words,
    status,
  }

  if (status === 'split-needs-review') {
    suspicious.splitMismatches.push(summary[level])
  }
}

for (const entry of vocab) {
  if (!entry.definition) suspicious.emptyDefinitions.push({
    id: entry.id,
    level: entry.level,
    word: entry.word,
    pinyin: entry.pinyin,
    pos: entry.pos,
  })

  if (entry.pos && /[A-Za-z]{4,}/.test(entry.pos.replace(/adj|adv|prep|conj|pron|part|pref|suf|num|interj|onom|idiom|expr/g, ''))) {
    suspicious.suspiciousPos.push({
      id: entry.id,
      level: entry.level,
      word: entry.word,
      pinyin: entry.pinyin,
      pos: entry.pos,
      definition: entry.definition,
    })
  }
}

writeArray(vocabPath, 'VocabEntry', vocabRead.exportName, vocab)
writeArray(characterPath, 'CharacterEntry', charRead.exportName, characters)

const report = {
  generatedAt: new Date().toISOString(),
  summary,
  totals: {
    vocabEntries: vocab.length,
    characterEntries: characters.length,
    fixedDefinitionLeaks,
    emptyDefinitions: suspicious.emptyDefinitions.length,
    suspiciousPos: suspicious.suspiciousPos.length,
    splitMismatches: suspicious.splitMismatches.length,
  },
  suspicious,
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')

console.log(`Loaded ${vocab.length} vocabulary entries.`)
console.log(`Loaded ${characters.length} character entries.`)
console.log(`Fixed definition leaks from POS field: ${fixedDefinitionLeaks}`)
console.log(`Still missing definitions: ${suspicious.emptyDefinitions.length}`)
console.log(`Suspicious POS fields remaining: ${suspicious.suspiciousPos.length}`)
console.log('Validation summary:')
for (const [level, item] of Object.entries(summary)) {
  console.log(`HSK ${level}: ${item.entries}/${item.expectedEntries} entries, ${item.characterRows}/${item.expectedCharacters} character rows, ${item.wordRows}/${item.expectedWords} word rows, status=${item.status}`)
}
console.log(`Wrote ${reportPath}`)
