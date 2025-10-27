import Papa from "papaparse"
import type { EventData, ProcessedEventData } from "@/lib/types/events"
import { getCachedData, setCachedData } from "@/lib/data-cache"

export interface FetchEventsOptions {
  url: string
  caching?: {
    enabled: boolean
  }
  columnMapping: {
    date: string
    type: string
    eventLocations: string
    firstEventDate: string
    goldsteinScore: string
  }
  processing: {
    locationDelimiter: string
  }
}

export async function fetchEvents(options: FetchEventsOptions): Promise<ProcessedEventData[]> {
  // Check cache first
  let text = getCachedData()

  // If not cached, fetch from network
  if (!text) {
    const response = await fetch(options.url)
    text = await response.text()

    // Cache the raw CSV text if caching is enabled
    if (options.caching?.enabled) {
      setCachedData(text)
    }
  }

  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true,
  })

  // Preprocess data once on load for better performance
  const processedData = parsed.data
    .map((row: any) => {
      const cleanRow: any = {}
      Object.keys(row).forEach((key) => {
        cleanRow[key.trim()] = row[key]
      })
      return cleanRow
    })
    .filter((row: any) => {
      // Use configured required fields for validation
      const dateCol = options.columnMapping.date
      const typeCol = options.columnMapping.type
      return row[dateCol] && row[typeCol]
    })
    .map((row: EventData) => {
      // Preprocess for performance using config mappings
      const locationCol = options.columnMapping.eventLocations
      const dateCol = options.columnMapping.date
      const firstEventDateCol = options.columnMapping.firstEventDate
      const goldsteinCol = options.columnMapping.goldsteinScore

      const processed: ProcessedEventData = {
        ...row,
        // Split country codes once instead of on every filter
        event_locations_array: row[locationCol]
          ? row[locationCol].split(options.processing.locationDelimiter).map((c) => c.trim())
          : [],
        // Parse dates once
        parsed_date: new Date(row[dateCol]),
        parsed_first_event_date: new Date(row[firstEventDateCol]),
        // Parse Goldstein score once
        parsed_goldstein: parseFloat(row[goldsteinCol]) || 0,
      }
      return processed
    })

  return processedData
}
