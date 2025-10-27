"use client"

import type { ViewMode } from "@/lib/types/events"
import { getCountryName, getTypeConfig, loadConfig } from "@/lib/config-loader"

interface DashboardHeaderProps {
  selectedType: string | null
  selectedCountry: string | null
  selectedWeek: string | null
  onClearFilters: () => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function DashboardHeader({
  selectedType,
  selectedCountry,
  selectedWeek,
  onClearFilters,
  viewMode,
  onViewModeChange,
}: DashboardHeaderProps) {
  const config = loadConfig()
  const hasFilters = selectedType || selectedCountry || selectedWeek

  return (
    <div className="mb-4 pb-3 border-b border-[#e0e0e0] flex-shrink-0 min-w-0">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-[26px] font-bold mb-0.5 tracking-tight text-[#1a1a1a] font-serif">
            What's Russia doing in Africa?
          </h1>
          <p className="text-xs text-[#666] font-light">An overview of events and activities</p>
        </div>

        {/* View Mode Toggle */}
        <div className="relative inline-flex bg-[#e0e0e0] rounded-full p-0.5 h-8">
          <div
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-0.125rem)] bg-[#1a1a1a] rounded-full transition-transform duration-300 ease-out"
            style={{
              transform: viewMode === "insights" ? "translateX(calc(100% + 0.25rem))" : "translateX(0)",
            }}
          />
          <button
            onClick={() => onViewModeChange("overview")}
            className={`relative z-10 px-4 text-xs font-semibold transition-colors duration-300 ${
              viewMode === "overview" ? "text-[#fafafa]" : "text-[#1a1a1a]"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => onViewModeChange("insights")}
            className={`relative z-10 px-4 text-xs font-semibold transition-colors duration-300 ${
              viewMode === "insights" ? "text-[#fafafa]" : "text-[#1a1a1a]"
            }`}
          >
            Insights
          </button>
        </div>
      </div>
      {hasFilters && (
        <div className="mt-2 flex gap-2 flex-wrap items-center">
          <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wide">Filters:</span>
          {selectedType && (
            <span className="bg-[#f5f5f5] px-2 py-0.5 text-[10px] text-[#1a1a1a] border border-[#e0e0e0]">
              {getTypeConfig(selectedType, config)?.label || selectedType}
            </span>
          )}
          {selectedCountry && (
            <span className="bg-[#f5f5f5] px-2 py-0.5 text-[10px] text-[#1a1a1a] border border-[#e0e0e0]">
              {getCountryName(selectedCountry, config)}
            </span>
          )}
          {selectedWeek && (
            <span className="bg-[#f5f5f5] px-2 py-0.5 text-[10px] text-[#1a1a1a] border border-[#e0e0e0]">
              {new Date(selectedWeek).toLocaleDateString()}
            </span>
          )}
          <button onClick={onClearFilters} className="text-[10px] text-[#666] hover:text-[#1a1a1a] underline ml-1">
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
