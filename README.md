# HanziForge

HSK 3.0 vocabulary and Chinese character writing trainer.

## What is included

- HSK 1, 2, 3, 4, 5, 6, and grouped HSK 7-9
- 11,000 vocabulary entries generated from HanziStroke HSK 3.0 PDFs
- Vocabulary recognition and recall
- Character writing practice per vocabulary item using Hanzi Writer
- Character browser by HSK level
- SRS review buttons: Again, Hard, Good, Easy
- Local progress stored in browser localStorage
- GitHub Pages deployment via GitHub Actions

## Validation summary

[
  {
    "level": "1",
    "entries": 300,
    "expectedEntries": 300,
    "characterRows": 137,
    "uniqueCharacters": 137,
    "expectedCharactersFromPdf": 137,
    "wordRows": 163,
    "expectedWordsFromPdf": 163,
    "status": "ok"
  },
  {
    "level": "2",
    "entries": 200,
    "expectedEntries": 200,
    "characterRows": 84,
    "uniqueCharacters": 82,
    "expectedCharactersFromPdf": 84,
    "wordRows": 116,
    "expectedWordsFromPdf": 116,
    "status": "ok"
  },
  {
    "level": "3",
    "entries": 500,
    "expectedEntries": 500,
    "characterRows": 134,
    "uniqueCharacters": 133,
    "expectedCharactersFromPdf": 134,
    "wordRows": 366,
    "expectedWordsFromPdf": 366,
    "status": "ok"
  },
  {
    "level": "4",
    "entries": 1000,
    "expectedEntries": 1000,
    "characterRows": 210,
    "uniqueCharacters": 207,
    "expectedCharactersFromPdf": 210,
    "wordRows": 790,
    "expectedWordsFromPdf": 790,
    "status": "ok"
  },
  {
    "level": "5",
    "entries": 1600,
    "expectedEntries": 1600,
    "characterRows": 266,
    "uniqueCharacters": 261,
    "expectedCharactersFromPdf": 266,
    "wordRows": 1334,
    "expectedWordsFromPdf": 1334,
    "status": "ok"
  },
  {
    "level": "6",
    "entries": 1800,
    "expectedEntries": 1800,
    "characterRows": 252,
    "uniqueCharacters": 246,
    "expectedCharactersFromPdf": 252,
    "wordRows": 1548,
    "expectedWordsFromPdf": 1548,
    "status": "ok"
  },
  {
    "level": "7-9",
    "entries": 5600,
    "expectedEntries": 5600,
    "characterRows": 513,
    "uniqueCharacters": 502,
    "expectedCharactersFromPdf": 512,
    "wordRows": 5087,
    "expectedWordsFromPdf": 5088,
    "status": "ok"
  }
]

Run validation:

```bash
npm run validate:data
```

## Deploy

Set GitHub Pages source to **GitHub Actions** and push to `main`.
