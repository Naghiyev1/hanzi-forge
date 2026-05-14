import fs from 'node:fs'

const summaryText = fs.readFileSync('src/data/generated/hsk-validation-summary.ts', 'utf8')
const reportPath = 'src/data/generated/hsk-quality-report.json'

function extractArray(text) {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Could not parse HSK_VALIDATION_SUMMARY array')
  }
  return JSON.parse(text.slice(start, end + 1))
}

const summary = extractArray(summaryText)
let failed = false

for (const s of summary) {
  const entriesOk = s.entries === s.expectedEntries
  const splitOk = s.characterRows === s.expectedCharactersFromPdf && s.wordRows === s.expectedWordsFromPdf

  console.log(
    `HSK ${s.level}: ${s.entries}/${s.expectedEntries} entries, ` +
    `${s.characterRows}/${s.expectedCharactersFromPdf} character rows, ` +
    `${s.wordRows}/${s.expectedWordsFromPdf} word rows, status=${s.status}`
  )

  if (!entriesOk) failed = true
  if (!splitOk) {
    console.warn(`Warning: HSK ${s.level} entry count is correct, but character/word split needs review.`)
  }
}

if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
  console.log(`Data cleanup report: ${report.fixedDefinitionLeaks ?? 0} POS/definition leaks fixed, ${report.stillMissingDefinition?.length ?? 0} missing definitions remaining.`)
  if ((report.stillMissingDefinition?.length ?? 0) > 0) {
    console.warn('Warning: some definitions are still missing. See src/data/generated/hsk-quality-report.json')
  }
} else {
  console.warn('Warning: hsk-quality-report.json not found. Run node scripts/clean-generated-data.mjs for a detailed data-quality report.')
}

if (failed) {
  console.error('Validation failed: at least one HSK level has an entry-count mismatch.')
  process.exit(1)
}
