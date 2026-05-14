import fs from 'node:fs'
import path from 'node:path'

const reportPath = path.join(process.cwd(), 'src', 'data', 'generated', 'hsk-quality-report.json')

if (!fs.existsSync(reportPath)) {
  console.error('Missing quality report. Run: node scripts/clean-generated-data.mjs')
  process.exit(1)
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
console.log('HanziForge data validation')
console.log(JSON.stringify(report.summary, null, 2))

const entryMismatches = Object.entries(report.summary).filter(([, item]) => item.status === 'entries-mismatch')
if (entryMismatches.length) {
  console.error('Entry count mismatch detected.')
  process.exit(1)
}

if (report.totals.emptyDefinitions > 0) {
  console.warn(`Warning: ${report.totals.emptyDefinitions} entries still have empty definitions. See hsk-quality-report.json.`)
}

if (report.totals.suspiciousPos > 0) {
  console.warn(`Warning: ${report.totals.suspiciousPos} suspicious POS fields remain. See hsk-quality-report.json.`)
}

if (report.totals.splitMismatches > 0) {
  console.warn(`Warning: ${report.totals.splitMismatches} level(s) have character/word split mismatches, but entry counts are correct.`)
}

console.log('Entry counts are valid.')
