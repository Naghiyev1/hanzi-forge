# HanziForge

A free, static Mandarin character trainer for GitHub Pages.

## Features

- HSK level-by-level training
- Character recognition and recall
- Pinyin, meaning, radical, stroke count, frequency rank
- Hanzi Writer stroke-order animation and stroke quiz
- Mobile finger support and desktop mouse support through Hanzi Writer
- Simple SRS review logic stored in `localStorage`
- Character browser and search
- GitHub Pages deployment workflow

## Important data note

This project is built to support full HSK 1-6 data, but the included dataset is a small starter set so the app can build immediately.

For production, paste your full lists into:

```text
data/raw/hsk1.tsv
data/raw/hsk2.tsv
data/raw/hsk3.tsv
data/raw/hsk4.tsv
data/raw/hsk5.tsv
data/raw/hsk6.tsv
```

Expected TSV columns:

```text
Character    Pinyin    Definition    Radical    Stroke count    HSK level    General Standard#    Frequency rank    Mnemonic
```

Then run:

```bash
npm install
npm run generate:data
npm run build
```

The generator validates missing fields, broken stroke counts, duplicate characters, and repeated pasted headers.

## Deploy to GitHub Pages

1. Create a repo called `hanzi-forge`.
2. Upload these files at the root.
3. Go to Settings → Pages.
4. Select Source: GitHub Actions.
5. Commit to `main`.

Your app should deploy to:

```text
https://YOUR_USERNAME.github.io/hanzi-forge/
```
