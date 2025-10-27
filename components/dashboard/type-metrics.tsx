"use client"

import { useMemo } from "react"
import type { ProcessedEventData } from "@/lib/types/events"
import { getTypeConfig, loadConfig } from "@/lib/config-loader"
import { InfoButton } from "@/components/info-button"

interface TypeMetricsProps {
  data: ProcessedEventData[]
  selectedType: string | null
  onTypeClick: (type: string) => void
  onShowInfo?: () => void
}

export function TypeMetrics({ data, selectedType, onTypeClick, onShowInfo }: TypeMetricsProps) {
  const config = loadConfig()

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ECON: 0, SEC: 0, DIP: 0, INFO: 0 }
    data.forEach((d) => {
      if (counts.hasOwnProperty(d.Type)) {
        counts[d.Type]++
      }
    })
    return counts
  }, [data])

  return (
    <div className="mb-6 flex-shrink-0 min-w-0">
      {onShowInfo && (
        <div className="flex items-center mb-2">
          <h2 className="text-sm font-semibold text-[#666] uppercase tracking-wide">Event Types</h2>
          <InfoButton onClick={onShowInfo} />
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {Object.entries(typeCounts).map(([type, count]) => {
        const typeConfig = getTypeConfig(type, config)
        if (!typeConfig) return null

        const isSelected = selectedType === type
        return (
          <div
            key={type}
            onClick={() => onTypeClick(type)}
            className={`border-l pl-3 py-1 cursor-pointer transition-all min-w-0 overflow-hidden ${
              isSelected ? "border-[#1a1a1a]" : "border-[#d0d0d0] hover:border-[#999]"
            }`}
            style={{
              borderLeftColor: isSelected ? typeConfig.color : undefined,
            }}
          >
            <div
              className="text-[11.5px] mb-0.5 uppercase tracking-wide font-semibold truncate"
              style={{ color: typeConfig.color }}
            >
              {typeConfig.label}
            </div>
            <div
              className={`text-[30px] font-bold leading-none tracking-tight ${
                isSelected ? "text-[#1a1a1a]" : "text-[#333]"
              }`}
            >
              {count}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
