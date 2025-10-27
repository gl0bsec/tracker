"use client"

import { useMemo } from "react"
import type { ProcessedEventData, SortColumn, SortDirection } from "@/lib/types/events"

export interface SearchOptions {
  searchQuery: string
  sortColumn: SortColumn | null
  sortDirection: SortDirection
}

export function useEventSearch(data: ProcessedEventData[], options: SearchOptions) {
  const { searchQuery, sortColumn, sortDirection } = options

  return useMemo(() => {
    let result = [...data]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          (d.title && d.title.toLowerCase().includes(query)) ||
          (d.description && d.description.toLowerCase().includes(query)) ||
          (d["Event name"] && d["Event name"].toLowerCase().includes(query))
      )
    }

    if (sortColumn) {
      result.sort((a, b) => {
        let aVal: any
        let bVal: any

        switch (sortColumn) {
          case "date":
            // Use preprocessed date for better performance
            aVal = a.parsed_date.getTime()
            bVal = b.parsed_date.getTime()
            break
          case "type":
            aVal = a.Type
            bVal = b.Type
            break
          case "title":
            aVal = a.title || ""
            bVal = b.title || ""
            break
          case "description":
            aVal = a.description || ""
            bVal = b.description || ""
            break
          case "source":
            aVal = a.SOURCEURL || ""
            bVal = b.SOURCEURL || ""
            break
          default:
            return 0
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchQuery, sortColumn, sortDirection])
}
