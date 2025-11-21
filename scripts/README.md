# Data Import Scripts

## Import News Data

This script imports new data from CSV files (like news extracts) into the main tracker data source.

### Features

- **Automatic field mapping**: Copies `title` → `Event name` field
- **Type validation**: Filters out entries with invalid type labels
- **Deduplication**: Skips entries that already exist (based on SOURCEURL)
- **Automatic backup**: Creates a backup before overwriting data
- **Detailed reporting**: Shows validation results and import statistics

### Valid Type Labels

Only entries with these type labels will be imported:
- `ECON` - Economic Influence
- `SEC` - Military & Security Operations
- `DIP` - Diplomatic Engagements
- `INFO` - Information Operations

All other entries (including `IRRELEVANT`, empty, or malformed labels) will be excluded.

### Usage

#### Basic Usage (defaults to news file in root):

```bash
pnpm import:news
```

This will:
1. Read from `Russia in africa tracker - news extract latest (labelled).csv`
2. Merge with `public/data.csv`
3. Create a backup at `public/data.csv.backup`
4. Overwrite `public/data.csv` with merged data

#### Advanced Usage (custom file paths):

```bash
pnpm import:news <news-file> <existing-data> <output-file>
```

Example:
```bash
pnpm import:news "my-news-data.csv" "public/data.csv" "public/data-updated.csv"
```

### Import Process

1. **Read & Parse**: Loads the news CSV file
2. **Validate**: Checks each row for:
   - Valid type label (ECON, SEC, DIP, INFO)
   - Required fields (date, title)
3. **Transform**: Maps columns to match existing schema:
   - `llm_result` → `Type`
   - `title` → `Event name`
   - `first_event_date` → `Date`
   - Adds empty placeholders for missing fields
4. **Deduplicate**: Filters out entries with duplicate SOURCEURLs
5. **Merge**: Combines with existing data
6. **Sort**: Orders by date (newest first)
7. **Output**: Writes the final CSV

### Output Example

```
🔄 Starting import process...

📖 Reading news data from: Russia in africa tracker - news extract latest (labelled).csv
   Found 507 rows in news data
   ✓ 207 rows have valid type labels
   ✗ 300 rows excluded (invalid/missing type labels)

   Excluded rows by type:
   - IRRELEVANT: 283
   - MISSING: 17

📖 Reading existing data from: public/data.csv
   Found 229 rows in existing data

📊 Deduplication results:
   - New unique entries: 205
   - Duplicates skipped: 2

💾 Writing merged data to: public/data.csv
   ✓ Total rows in output: 434
   ✓ New rows added: 205

✅ Import completed successfully!

📈 New entries by type:
   - DIP: 107
   - SEC: 44
   - INFO: 21
   - ECON: 33
```

### Field Mapping

| News CSV Field | Existing Schema Field |
|----------------|----------------------|
| `first_event_date` | `Date` |
| `title` | `Event name` (copied) |
| `title` | `title` |
| `llm_result` | `Type` |
| `SOURCEURL` | `SOURCEURL` |
| `description` | `description` |
| `actor1_countries` | `actor1_countries` |
| `actor2_countries` | `actor2_countries` |
| `event_locations` | `event_locations` |
| `keywords` | `keywords` |
| `event_count` | `event_count` |
| `avg_goldstein_score` | `avg_goldstein_score` |
| `site_name` | `site_name` |
| `language` | `language` |
| `actor1_names` | `actor1_names` |
| `actor2_names` | `actor2_names` |
| `event_descriptions` | `event_descriptions` |
| `author` | `author` |

### Safety Features

- **Automatic backup**: A backup file is always created before overwriting
- **Validation**: Invalid entries are excluded before import
- **Deduplication**: Prevents duplicate entries
- **Non-destructive**: Original news file is never modified

### Troubleshooting

**Error: News file not found**
- Check that the file path is correct
- Make sure the file exists in the project root (or specify full path)

**Error: Existing data file not found**
- Ensure `public/data.csv` exists
- Check file permissions

**No new entries added**
- All entries might be duplicates (check SOURCEURL)
- All entries might have invalid type labels
- Check the excluded rows breakdown in the output

### Reverting Changes

If you need to revert the import:

```bash
cp public/data.csv.backup public/data.csv
```
