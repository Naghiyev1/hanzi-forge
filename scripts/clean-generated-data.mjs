import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const vocabFile = path.join(root, 'src/data/generated/hsk-vocab-data.ts')
const summaryFile = path.join(root, 'src/data/generated/hsk-validation-summary.ts')
const reportFile = path.join(root, 'src/data/generated/hsk-quality-report.json')

const EXPECTED = {
  '1': { entries: 300, characters: 137, words: 163 },
  '2': { entries: 200, characters: 84, words: 116 },
  '3': { entries: 500, characters: 134, words: 366 },
  '4': { entries: 1000, characters: 210, words: 790 },
  '5': { entries: 1600, characters: 266, words: 1334 },
  '6': { entries: 1800, characters: 252, words: 1548 },
  '7-9': { entries: 5600, characters: 512, words: 5088 },
}

const POS_LABELS = new Set([
  'n', 'v', 'adj', 'adv', 'prep', 'conj', 'part', 'pron', 'num', 'mw',
  'pref', 'suf', 'interj', 'aux', 'modal', 'onom', 'phrase', 'abbr',
])

function extractArrayFromTs(filePath, constName) {
  const text = fs.readFileSync(filePath, 'utf8')
  const exportIndex = text.indexOf(`export const ${constName}`)
  if (exportIndex === -1) throw new Error(`Could not find export const ${constName} in ${filePath}`)

  const arrayStart = text.indexOf('[', exportIndex)
  if (arrayStart === -1) throw new Error(`Could not find array start for ${constName}`)

  let depth = 0
  let inString = false
  let quote = ''
  let escaped = false

  for (let i = arrayStart; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === quote) {
        inString = false
        quote = ''
      }
      continue
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true
      quote = ch
      continue
    }

    if (ch === '[') depth += 1
    if (ch === ']') depth -= 1

    if (depth === 0) {
      const arrayText = text.slice(arrayStart, i + 1)
      return JSON.parse(arrayText)
    }
  }

  throw new Error(`Could not find array end for ${constName}`)
}

function cleanLineMarkers(value) {
  return String(value ?? '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/^L\d+:\s*/i, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isValidPosToken(candidate) {
  if (!candidate) return false
  const cleaned = candidate
    .replace(/[().]/g, '')
    .replace(/-/g, '')
    .trim()
  if (!cleaned) return false

  const parts = cleaned
    .split('/')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

  return parts.length > 0 && parts.every((part) => POS_LABELS.has(part))
}

function splitPosAndDefinition(posValue) {
  const raw = String(posValue ?? '').replace(/\\n/g, '\n').replace(/\r/g, '').trim()
  if (!raw) return { pos: '', leakedDefinition: '' }

  const normalized = raw.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  const firstSpace = normalized.search(/\s/)
  const firstToken = firstSpace === -1 ? normalized : normalized.slice(0, firstSpace)
  const rest = firstSpace === -1 ? '' : normalized.slice(firstSpace + 1).trim()

  if (isValidPosToken(firstToken)) {
    return {
      pos: firstToken,
      leakedDefinition: cleanLineMarkers(rest),
    }
  }

  return { pos: cleanLineMarkers(raw), leakedDefinition: '' }
}

function chineseChars(value) {
  return Array.from(value || '').filter((ch) => /[\u4e00-\u9fff]/.test(ch))
}

function qualityFlags(entry) {
  const flags = []
  if (!entry.word) flags.push('missing-word')
  if (!entry.pinyin) flags.push('missing-pinyin')
  if (!entry.definition) flags.push('missing-definition')
  if (entry.pos && entry.pos.length > 22) flags.push('long-pos')
  if (entry.pos && /[;,:]|\b(to|the|and|or|of|in|for|with|correct|right|not|from|house)\b/i.test(entry.pos)) flags.push('pos-may-contain-definition')
  if (!chineseChars(entry.word).length) flags.push('word-has-no-cjk')
  return flags
}

const vocab = extractArrayFromTs(vocabFile, 'HSK_VOCAB')

const report = {
  totalBefore: vocab.length,
  fixedDefinitionLeaks: 0,
  cleanedAlsoFields: 0,
  stillMissingDefinition: [],
  suspiciousPos: [],
  splitMismatches: [],
  sampleFixes: [],
}

const cleaned = vocab.map((entry) => {
  const next = { ...entry }

  const beforePos = next.pos ?? ''
  const beforeDef = next.definition ?? ''
  const split = splitPosAndDefinition(beforePos)

  if (!beforeDef && split.leakedDefinition) {
    next.pos = split.pos
    next.definition = split.leakedDefinition
    report.fixedDefinitionLeaks += 1
    if (report.sampleFixes.length < 20) {
      report.sampleFixes.push({
        id: next.id,
        word: next.word,
        beforePos,
        afterPos: next.pos,
        afterDefinition: next.definition,
      })
    }
  } else {
    next.pos = cleanLineMarkers(beforePos)
  }

  next.definition = cleanLineMarkers(next.definition)

  if (next.also) {
    const beforeAlso = next.also
    next.also = cleanLineMarkers(next.also)
    if (beforeAlso !== next.also) report.cleanedAlsoFields += 1
  }

  const flags = qualityFlags(next)
  if (flags.includes('missing-definition')) {
    report.stillMissingDefinition.push({ id: next.id, level: next.level, word: next.word, pinyin: next.pinyin, pos: next.pos })
  }
  if (flags.includes('pos-may-contain-definition') || flags.includes('long-pos')) {
    report.suspiciousPos.push({ id: next.id, level: next.level, word: next.word, pinyin: next.pinyin, pos: next.pos, definition: next.definition })
  }

  return next
})

const summary = Object.entries(EXPECTED).map(([level, expected]) => {
  const entries = cleaned.filter((entry) => entry.level === level)
  const characterRows = entries.filter((entry) => chineseChars(entry.word).length === 1).length
  const wordRows = entries.length - characterRows
  const uniqueCharacters = new Set(entries.flatMap((entry) => chineseChars(entry.word))).size

  let status = 'ok'
  if (entries.length !== expected.entries) status = 'entries-mismatch'
  else if (characterRows !== expected.characters || wordRows !== expected.words) status = 'split-needs-review'

  if (status !== 'ok') {
    report.splitMismatches.push({
      level,
      entries: entries.length,
      expectedEntries: expected.entries,
      characterRows,
      expectedCharactersFromPdf: expected.characters,
      wordRows,
      expectedWordsFromPdf: expected.words,
      status,
    })
  }

  return {
    level,
    entries: entries.length,
    expectedEntries: expected.entries,
    characterRows,
    uniqueCharacters,
    expectedCharactersFromPdf: expected.characters,
    wordRows,
    expectedWordsFromPdf: expected.words,
    status,
  }
})

function writeTsArray(filePath, constName, typeName, data) {
  const content =
`// @ts-nocheck
import type { ${typeName} } from '../types'

export const ${constName}: ${typeName}[] = ${JSON.stringify(data, null, 2)}
`
  fs.writeFileSync(filePath, content, 'utf8')
}

writeTsArray(vocabFile, 'HSK_VOCAB', 'VocabEntry', cleaned)

fs.writeFileSync(
  summaryFile,
`// @ts-nocheck
export const HSK_VALIDATION_SUMMARY = ${JSON.stringify(summary, null, 2)}
`,
  'utf8',
)

report.totalAfter = cleaned.length
report.summary = summary
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8')

console.log(`Cleaned ${cleaned.length} vocabulary entries.`)
console.log(`Fixed definition leaks from POS field: ${report.fixedDefinitionLeaks}`)
console.log(`Cleaned alternate-pronunciation fields: ${report.cleanedAlsoFields}`)
console.log(`Still missing definitions: ${report.stillMissingDefinition.length}`)
console.log(`Suspicious POS fields remaining: ${report.suspiciousPos.length}`)
console.log('Validation summary:')
for (const item of summary) {
  console.log(`HSK ${item.level}: ${item.entries}/${item.expectedEntries} entries, ${item.characterRows}/${item.expectedCharactersFromPdf} character rows, ${item.wordRows}/${item.expectedWordsFromPdf} word rows, status=${item.status}`)
}

if (summary.some((item) => item.status === 'entries-mismatch')) {
  console.error('Entry count mismatch detected. Review hsk-quality-report.json.')
  process.exit(1)
}
