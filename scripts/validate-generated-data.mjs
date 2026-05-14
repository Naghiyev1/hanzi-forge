import fs from 'node:fs'
const text = fs.readFileSync('src/data/generated/hsk-validation-summary.ts', 'utf8')
const json = text.slice(text.indexOf('=') + 1).trim().replace(/;?$/, '')
const summary = JSON.parse(json)
let failed = false
for (const s of summary) {
  const ok = s.entries === s.expectedEntries
  console.log(`HSK ${s.level}: ${s.entries}/${s.expectedEntries} entries, ${s.characterRows} single-character rows (${s.uniqueCharacters} unique), ${s.wordRows} word rows`)
  if (!ok) failed = true
}
if (failed) process.exit(1)
