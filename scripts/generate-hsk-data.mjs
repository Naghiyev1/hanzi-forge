import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const rawDir = path.join(root, 'data', 'raw')
const outFile = path.join(root, 'src', 'data', 'generated', 'hsk-data.ts')
const checkOnly = process.argv.includes('--check')
const clean = (v) => String(v ?? '').trim()
function parseRadical(raw) { const value = clean(raw); const match = value.match(/^(\S+)\s+(.+)$/); return match ? { radical: match[1], radicalMeta: match[2] } : { radical: value, radicalMeta: '' } }
function parseFile(level) {
  const file = path.join(rawDir, `hsk${level}.tsv`)
  if (!fs.existsSync(file)) return []
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const rows = []
  for (const [index, line] of lines.entries()) {
    if (/^character\s+/i.test(line) || /^pinyin\s+/i.test(line)) continue
    const cells = line.split('\t').map(clean)
    if (cells.length < 8) { console.warn(`Skipping short row in hsk${level}.tsv:${index + 1}: ${line}`); continue }
    const [character, pinyin, definition, radicalRaw, strokeRaw, hskRaw, generalStandard, frequencyRaw, mnemonic = ''] = cells
    const strokeCount = Number(strokeRaw)
    const hskLevel = Number(hskRaw || level)
    const frequencyRank = frequencyRaw ? Number(frequencyRaw) : undefined
    const { radical, radicalMeta } = parseRadical(radicalRaw)
    rows.push({ id: `hsk${hskLevel}-${character}`, character, pinyin, definition, radical, radicalMeta, strokeCount, hskLevel, generalStandard, frequencyRank, mnemonic, _source: `hsk${level}.tsv:${index + 1}` })
  }
  return rows
}
const entries = []
for (let level = 1; level <= 6; level++) entries.push(...parseFile(level))
const errors = [], warnings = [], seenIds = new Set(), seenCharsByLevel = new Set(), seenChars = new Map()
for (const entry of entries) {
  if (!entry.character) errors.push(`${entry._source}: missing character`)
  if (!entry.pinyin) errors.push(`${entry._source}: missing pinyin for ${entry.character}`)
  if (!Number.isFinite(entry.strokeCount)) errors.push(`${entry._source}: invalid stroke count for ${entry.character}`)
  if (!Number.isFinite(entry.hskLevel) || entry.hskLevel < 1 || entry.hskLevel > 6) errors.push(`${entry._source}: invalid HSK level for ${entry.character}`)
  if (entry.frequencyRank !== undefined && !Number.isFinite(entry.frequencyRank)) errors.push(`${entry._source}: invalid frequency rank for ${entry.character}`)
  if (!entry.definition) warnings.push(`${entry._source}: missing definition for ${entry.character}`)
  if (seenIds.has(entry.id)) errors.push(`${entry._source}: duplicate id ${entry.id}`); seenIds.add(entry.id)
  const sameLevelKey = `${entry.hskLevel}-${entry.character}`
  if (seenCharsByLevel.has(sameLevelKey)) errors.push(`${entry._source}: duplicate character ${entry.character} inside HSK ${entry.hskLevel}`); seenCharsByLevel.add(sameLevelKey)
  if (seenChars.has(entry.character) && seenChars.get(entry.character) !== entry.hskLevel) warnings.push(`${entry._source}: ${entry.character} also appears in HSK ${seenChars.get(entry.character)}`)
  else seenChars.set(entry.character, entry.hskLevel)
}
const counts = [1,2,3,4,5,6].map(level => ({ level, count: entries.filter(e => e.hskLevel === level).length }))
console.log('HSK data counts:', counts.map(i => `HSK${i.level}: ${i.count}`).join(', '))
if (warnings.length) { console.warn(`Warnings (${warnings.length}):`); warnings.slice(0, 50).forEach(w => console.warn(' - ' + w)); if (warnings.length > 50) console.warn(` - ...and ${warnings.length - 50} more`) }
if (errors.length) { console.error(`Errors (${errors.length}):`); errors.forEach(e => console.error(' - ' + e)); process.exit(1) }
if (!checkOnly) {
  const cleanEntries = entries.sort((a,b)=>(a.hskLevel-b.hskLevel)||((a.frequencyRank??999999)-(b.frequencyRank??999999))).map(({ _source, ...entry }) => entry)
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, `import type { HanziEntry } from '../types'\n\nexport const HSK_DATA: HanziEntry[] = ${JSON.stringify(cleanEntries, null, 2)}\n`, 'utf8')
  console.log(`Generated ${outFile}`)
}
