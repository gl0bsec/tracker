# Quick Reference: Import News Data

## Import new data from CSV files

```bash
pnpm import:news
```

This will:
- Read from `Russia in africa tracker - news extract latest (labelled).csv`
- Filter out invalid type labels (keeps only: ECON, SEC, DIP, INFO)
- Copy `title` field to `Event name` field
- Remove duplicates based on SOURCEURL
- Create a backup at `public/data.csv.backup`
- Merge and update `public/data.csv`

## Results Summary

The last import processed:
- **507 total rows** in source file
- **207 valid rows** (with valid type labels)
- **300 excluded rows** (IRRELEVANT or invalid labels)
- **205 new unique entries** added
- **2 duplicates** skipped

Final data: **434 total events** (was 229, now 434)

## Custom Usage

```bash
pnpm import:news <news-file> <existing-data> <output-file>
```

## Revert if needed

```bash
cp public/data.csv.backup public/data.csv
```

See [scripts/README.md](scripts/README.md) for full documentation.
