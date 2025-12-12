#!/usr/bin/env tsx

import * as fs from 'fs'
import * as path from 'path'
import Papa from 'papaparse'

// Valid type labels according to config.json
const VALID_TYPES = ['ECON', 'SEC', 'DIP', 'INFO']

interface NewsRow {
  first_event_date: string
  SOURCEURL: string
  title: string
  description: string
  content?: string
  avg_goldstein_score: string
  min_goldstein_score?: string
  max_goldstein_score?: string
  goldstein_score_std?: string
  event_count: string
  actor1_names: string
  actor2_names: string
  actor1_countries: string
  actor2_countries: string
  event_locations: string
  last_event_date?: string
  event_descriptions: string
  date_span_days?: string
  keywords: string
  author: string
  site_name: string
  image?: string
  favicon?: string
  canonical_url?: string
  language: string
  content_type?: string
  status_code?: string
  error?: string
  llm_result?: string
  Type?: string // For new CSV format where Type is a column
  Date?: string // For new CSV format where Date is a column
  'Event name'?: string // For new CSV format
}

interface ExistingRow {
  SOURCEURL: string
  Date: string
  'Event name': string
  Type: string
  cluster: string
  actor1_countries: string
  actor2_countries: string
  event_locations: string
  combined_text_entities: string
  combined_text_entity_types: string
  keywords: string
  first_event_date: string
  title: string
  description: string
  event_count: string
  avg_goldstein_score: string
  site_name: string
  language: string
  actor1_names: string
  actor2_names: string
  event_descriptions: string
  author: string
}

function transformNewsRow(row: NewsRow): ExistingRow {
  // Handle both old format (llm_result) and new format (Type column)
  const type = row.Type || row.llm_result || ''
  const date = row.Date || row.first_event_date || ''
  const eventName = row['Event name'] || row.title || ''

  return {
    SOURCEURL: row.SOURCEURL || '',
    Date: date,
    'Event name': eventName,
    Type: type,
    cluster: '', // Not available in news data
    actor1_countries: row.actor1_countries || '',
    actor2_countries: row.actor2_countries || '',
    event_locations: row.event_locations || '',
    combined_text_entities: '', // Not available in news data
    combined_text_entity_types: '', // Not available in news data
    keywords: row.keywords || '',
    first_event_date: row.first_event_date || date,
    title: row.title || '',
    description: row.description || '',
    event_count: row.event_count || '',
    avg_goldstein_score: row.avg_goldstein_score || '',
    site_name: row.site_name || '',
    language: row.language || '',
    actor1_names: row.actor1_names || '',
    actor2_names: row.actor2_names || '',
    event_descriptions: row.event_descriptions || '',
    author: row.author || ''
  }
}

function isValidRow(row: NewsRow): boolean {
  // Handle both old format (llm_result) and new format (Type column)
  const type = row.Type || row.llm_result || ''

  // Check if type exists and is valid
  if (!type || !VALID_TYPES.includes(type.trim())) {
    return false
  }

  // Check if required fields exist
  const date = row.Date || row.first_event_date || ''
  const title = row.title || ''

  if (!date || !title) {
    return false
  }

  return true
}

async function importNewsData(newsFilePath: string, existingDataPath: string, outputPath: string) {
  console.log('🔄 Starting import process...\n')

  // Read news data
  console.log(`📖 Reading news data from: ${newsFilePath}`)
  const newsContent = fs.readFileSync(newsFilePath, 'utf-8')
  const newsParsed = Papa.parse<NewsRow>(newsContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  })

  console.log(`   Found ${newsParsed.data.length} rows in news data`)

  // Filter and validate news data
  const validNewsRows = newsParsed.data.filter(isValidRow)
  console.log(`   ✓ ${validNewsRows.length} rows have valid type labels`)
  console.log(`   ✗ ${newsParsed.data.length - validNewsRows.length} rows excluded (invalid/missing type labels)\n`)

  // Show breakdown of excluded rows by type
  const excludedByType: Record<string, number> = {}
  newsParsed.data.forEach(row => {
    if (!isValidRow(row)) {
      const type = row.Type || row.llm_result || 'MISSING'
      excludedByType[type] = (excludedByType[type] || 0) + 1
    }
  })

  if (Object.keys(excludedByType).length > 0) {
    console.log('   Excluded rows by type:')
    Object.entries(excludedByType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`)
    })
    console.log()
  }

  // Transform news rows to existing schema
  const transformedRows = validNewsRows.map(transformNewsRow)

  // Read existing data
  console.log(`📖 Reading existing data from: ${existingDataPath}`)
  const existingContent = fs.readFileSync(existingDataPath, 'utf-8')
  const existingParsed = Papa.parse<ExistingRow>(existingContent, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  })

  console.log(`   Found ${existingParsed.data.length} rows in existing data\n`)

  // Deduplicate based on SOURCEURL
  const existingUrls = new Set(existingParsed.data.map(row => row.SOURCEURL))
  const newRows = transformedRows.filter(row => !existingUrls.has(row.SOURCEURL))

  console.log(`📊 Deduplication results:`)
  console.log(`   - New unique entries: ${newRows.length}`)
  console.log(`   - Duplicates skipped: ${transformedRows.length - newRows.length}\n`)

  // Merge data
  const mergedData = [...existingParsed.data, ...newRows]

  // Sort by date (newest first)
  mergedData.sort((a, b) => {
    const dateA = new Date(a.Date).getTime()
    const dateB = new Date(b.Date).getTime()
    return dateB - dateA
  })

  // Write output
  console.log(`💾 Writing merged data to: ${outputPath}`)
  const csv = Papa.unparse(mergedData, {
    header: true
  })

  fs.writeFileSync(outputPath, csv, 'utf-8')

  console.log(`   ✓ Total rows in output: ${mergedData.length}`)
  console.log(`   ✓ New rows added: ${newRows.length}\n`)

  console.log('✅ Import completed successfully!')

  // Show summary by type
  const typeCounts: Record<string, number> = {}
  newRows.forEach(row => {
    typeCounts[row.Type] = (typeCounts[row.Type] || 0) + 1
  })

  console.log('\n📈 New entries by type:')
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   - ${type}: ${count}`)
  })
}

// Main execution
const newsFilePath = process.argv[2] || 'ingest/Russia in africa tracker - Russia in africa tracker - Timeline w metadata (filled from news).csv'
const existingDataPath = process.argv[3] || 'public/data.csv'
const outputPath = process.argv[4] || 'public/data.csv'

// Check if files exist
if (!fs.existsSync(newsFilePath)) {
  console.error(`❌ Error: News file not found: ${newsFilePath}`)
  process.exit(1)
}

if (!fs.existsSync(existingDataPath)) {
  console.error(`❌ Error: Existing data file not found: ${existingDataPath}`)
  process.exit(1)
}

// Warn if overwriting
if (existingDataPath === outputPath) {
  console.log('⚠️  Warning: This will overwrite the existing data file.')
  console.log('   A backup will be created at: public/data.csv.backup\n')

  // Create backup
  fs.copyFileSync(existingDataPath, `${existingDataPath}.backup`)
  console.log('✓ Backup created\n')
}

importNewsData(newsFilePath, existingDataPath, outputPath)
  .catch(error => {
    console.error('❌ Error during import:', error)
    process.exit(1)
  })
