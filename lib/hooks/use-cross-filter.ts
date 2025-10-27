"use client"

import { useMemo } from "react"
import type { ProcessedEventData } from "@/lib/types/events"

export interface CrossFilterOptions {
  selectedType: string | null
  selectedCountry: string | null
  selectedWeek: string | null
}

export function useCrossFilter(data: ProcessedEventData[], options: CrossFilterOptions) {
  const { selectedType, selectedCountry, selectedWeek } = options

  return useMemo(() => {
    return data.filter((d) => {
      // Filter empty titles
      if (!d.title || d.title.trim() === "" || d.title === "N/A") return false

      // Filter by type
      if (selectedType && d.Type !== selectedType) return false

      // Filter by country using preprocessed array (faster than string.includes)
      if (selectedCountry && !d.event_locations_array.includes(selectedCountry)) return false

      // Filter by week using preprocessed date (no repeated parsing)
      if (selectedWeek) {
        const weekStart = new Date(d.parsed_first_event_date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekKey = weekStart.toISOString().split("T")[0]
        if (weekKey !== selectedWeek) return false
      }

      return true
    })
  }, [data, selectedType, selectedCountry, selectedWeek])
}
