# HanziForge

HanziForge is a Mandarin vocabulary and character-writing trainer for the HSK 3.0 curriculum.

It combines vocabulary study, character recognition, Hanzi Writer stroke-order practice, and lightweight spaced repetition so learners can move level by level through HSK 1–6 and the advanced HSK 7–9 set.

**Live app:**  
https://naghiyev1.github.io/hanzi-forge/

---

## What is included

- Full HSK 3.0 vocabulary dataset
- HSK 1, 2, 3, 4, 5, 6, and grouped HSK 7–9
- 11,000 vocabulary entries
- 6,947 generated character practice entries
- Vocabulary study mode
- Character recognition support
- Character writing practice with Hanzi Writer
- Search by Chinese, pinyin, definition, level, or part of speech
- Local progress tracking in the browser
- Simple SRS-style review actions
- GitHub Pages deployment via GitHub Actions
- No backend, account system, database, or paid hosting required

---

## Dataset coverage

| Level | Entries |
|---|---:|
| HSK 1 | 300 |
| HSK 2 | 200 |
| HSK 3 | 500 |
| HSK 4 | 1,000 |
| HSK 5 | 1,600 |
| HSK 6 | 1,800 |
| HSK 7–9 | 5,600 |
| **Total** | **11,000** |

The generated validation report is stored at:

```text
src/data/generated/hsk-quality-report.json
```

Current validation status:

- HSK 1–6 entry counts match expected totals.
- HSK 7–9 contains all 5,600 entries.
- HSK 7–9 has one character/word split flagged for review, but no vocabulary entry is missing.
- A small number of entries are still flagged for manual data polish, mostly parser leftovers from source formatting.

---

## App purpose

The goal of HanziForge is to help Mandarin learners do more than passively read vocabulary lists.

The app is designed around three learning jobs:

1. **Recognise the character or word**
2. **Understand the pinyin and meaning**
3. **Practise writing the character by hand**

This matters because Mandarin vocabulary learning is not just memorising translations. Learners need to connect visual form, pronunciation, meaning, and motor memory.

---

## Core features

### Level-based learning

Users can study HSK vocabulary level by level:

- HSK 1
- HSK 2
- HSK 3
- HSK 4
- HSK 5
- HSK 6
- HSK 7–9

HSK 7–9 is grouped because the advanced levels are published as one combined set.

### Vocabulary study

Each vocabulary entry includes relevant learning data such as:

- Chinese word or character
- Pinyin
- Definition
- Level
- Part of speech where available

### Character writing practice

HanziForge uses Hanzi Writer for stroke-order practice.

Users can practise characters using:

- Mouse on desktop
- Finger input on mobile or tablet
- Stroke animation and guided writing support from Hanzi Writer

### Search

Users can search across the dataset by:

- Chinese characters
- Pinyin
- English definition
- HSK level
- Part of speech

### Local progress

Progress is stored locally in the user’s browser.

There is no login system, backend, cloud sync, or database. This keeps the app lightweight and free to host.

### Lightweight SRS logic

The app includes simple spaced-repetition-style review actions so learners can mark items based on how well they know them.

The current SRS system is intentionally lightweight and browser-local. It can be improved later with more advanced scheduling logic.

---

## Tech stack

- React
- TypeScript
- Vite
- Hanzi Writer
- GitHub Pages
- GitHub Actions

---

## Project structure

```text
hanzi-forge/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── scripts/
│   ├── clean-generated-data.mjs
│   └── validate-generated-data.mjs
├── src/
│   ├── data/
│   │   └── generated/
│   │       ├── hsk-character-data.ts
│   │       ├── hsk-quality-report.json
│   │       ├── hsk-validation-summary.ts
│   │       └── hsk-vocab-data.ts
│   ├── main.tsx
│   └── styles.css
├── .gitignore
├── index.html
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```

---

## Local development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Validate generated HSK data:

```bash
npm run validate:data
```

---

## Deployment

The app deploys automatically to GitHub Pages when changes are pushed to the `main` branch.

Workflow file:

```text
.github/workflows/deploy.yml
```

Production URL:

```text
https://naghiyev1.github.io/hanzi-forge/
```

The deployment process:

1. GitHub Actions runs after a push to `main`.
2. Dependencies are installed.
3. Generated HSK data is validated.
4. The app is built with Vite.
5. The `dist` output is uploaded as a GitHub Pages artifact.
6. GitHub Pages serves the deployed app.

---

## Data validation

The generated data is checked with:

```bash
npm run validate:data
```

The validation system checks:

- Expected entry totals by HSK level
- Character rows versus word rows
- Missing definitions
- Suspicious part-of-speech fields
- Generated quality report output

The quality report is generated at:

```text
src/data/generated/hsk-quality-report.json
```

Known current note:

```text
HSK 7–9 has one character/word split flagged for review.
Total HSK 7–9 entries are correct: 5,600 / 5,600.
```

This is not currently treated as a blocking issue because no vocabulary entry is missing.

---

## Current known data-cleanup notes

The dataset is complete at the entry-count level.

Remaining polish items:

- Review the single HSK 7–9 character/word split mismatch.
- Review the small number of entries with empty definitions.
- Review suspicious POS fields left from parser/source formatting.
- Improve source-data traceability if the app becomes more public-facing.

These are data-polish tasks, not deployment blockers.

---

## Hosting model

HanziForge is designed to stay free to run.

It uses:

- GitHub repository for source code
- GitHub Actions for builds
- GitHub Pages for hosting
- Browser localStorage for progress

There is no backend cost.

---

## Privacy

HanziForge does not require login.

User progress is stored locally in the browser. It is not synced to a server.

Clearing browser data may remove saved progress.

---

## Future improvement ideas

Potential next improvements:

- Better mobile writing layout
- “Continue where I left off” button
- Daily review count
- Due-review filter
- Known / learning / difficult filters
- More advanced SRS scheduling
- Better onboarding screen
- Progress by HSK level
- Option to hide pinyin during recall
- Option to hide meaning during recall
- Improved dark mode refinement
- Better distinction between vocabulary mode and character-writing mode
- Export/import progress
- Manual cleanup of remaining flagged dataset rows
- Code-splitting to reduce JavaScript bundle size

---

## Maintenance notes

Avoid committing generated build folders or dependency folders.

These should stay ignored:

```text
node_modules/
dist/
tsconfig.tsbuildinfo
*.log
.env
```

If Codespaces shows build junk again, clean it with:

```bash
rm -rf node_modules dist package-lock.json tsconfig.tsbuildinfo
```

Then check repository state:

```bash
git status
```

A clean state should show:

```text
nothing to commit, working tree clean
```

---

## License

No license has been added yet.

If this project is intended to be open source, add a license file before inviting external contributions.
