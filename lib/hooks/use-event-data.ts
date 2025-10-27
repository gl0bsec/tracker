"use client"

import { useState, useEffect } from "react"
import type { ProcessedEventData } from "@/lib/types/events"
import { fetchEvents } from "@/lib/data/fetch-events"
import { loadConfig } from "@/lib/config-loader"

export function useEventData() {
  const [data, setData] = useState<ProcessedEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const config = loadConfig()

        const processedData = await fetchEvents({
          url: config.data.source.url,
          caching: config.data.source.caching,
          columnMapping: config.data.columnMapping,
          processing: config.data.processing,
        })

        setData(processedData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return { data, loading, error }
}
