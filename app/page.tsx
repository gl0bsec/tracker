"use client"

import { useState, useMemo } from "react"
import Papa from "papaparse"
import dynamic from "next/dynamic"
import type { EventData, SortColumn, SortDirection, TimelineLayout, ViewMode } from "@/lib/types/events"
import { loadConfig } from "@/lib/config-loader"
import { insights } from "@/lib/insights-client"
import { InsightCard } from "@/components/insight-card"
import { useEventData } from "@/lib/hooks/use-event-data"
import { useCrossFilter } from "@/lib/hooks/use-cross-filter"
import { useEventSearch } from "@/lib/hooks/use-event-search"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TypeMetrics } from "@/components/dashboard/type-metrics"
import { EventsFeed } from "@/components/dashboard/events-feed"
import { EventsTable } from "@/components/dashboard/events-table"
import { LocationSection } from "@/components/dashboard/location-section"

const D3Timeline = dynamic(() => import("@/components/d3-timeline"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-[#a5a5a5] text-sm">Loading timeline...</div>,
})

export default function Dashboard() {
  const config = useMemo(() => loadConfig(), [])
  const { data, loading, error } = useEventData()

  // Cross-filtering state
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [isMapMode, setIsMapMode] = useState(true)
  const [timelineLayout, setTimelineLayout] = useState<TimelineLayout>("feed")

  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(null)

  // Timeline zoom state
  const [zoomRange, setZoomRange] = useState<{ start: Date; end: Date } | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("overview")

  // Selected insight for modal
  const [selectedInsight, setSelectedInsight] = useState<(typeof insights)[0] | null>(null)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column as SortColumn)
      setSortDirection("asc")
    }
  }

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredAndSearchedData)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `russia-africa-events-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Apply cross-filtering
  const filteredData = useCrossFilter(data, { selectedType, selectedCountry, selectedWeek })

  // Apply search and sort
  const filteredAndSearchedData = useEventSearch(filteredData, { searchQuery, sortColumn, sortDirection })

  const stripPlotData = useMemo(() => {
    return filteredData
      .filter((d) => d.first_event_date)
      .map((d) => ({
        type: d.Type,
        date: d.parsed_first_event_date,
        title: d.title || d["Event name"] || "Event",
        description: d.description || "No description available",
        eventData: d,
      }))
  }, [filteredData])

  const defaultStartDate = new Date("2025-06-01")
  const defaultEndDate = new Date("2025-10-05")

  const clearFilters = () => {
    setSelectedType(null)
    setSelectedCountry(null)
    setSelectedWeek(null)
    setSearchQuery("")
    setSortColumn(null)
  }

  const resetZoom = () => {
    setZoomRange(null)
  }

  const handleTypeClick = (type: string) => {
    setSelectedType(selectedType === type ? null : type)
  }

  const handleCountryClick = (code: string) => {
    setSelectedCountry(selectedCountry === code ? null : code)
  }

  const handleTimelinePointClick = (eventData: EventData) => {
    const rowIndex = filteredAndSearchedData.findIndex(
      (e) => e.Date === eventData.Date && e.title === eventData.title && e.Type === eventData.Type
    )

    if (rowIndex !== -1) {
      const rowElement = document.querySelector(`#event-row-${rowIndex}`)
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }

      setHighlightedRowIndex(rowIndex)

      setTimeout(() => {
        setHighlightedRowIndex(null)
      }, 1000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f6f2] text-[#1a1a1a] flex items-center justify-center">
        <div className="text-sm text-[#666]">Loading data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f9f6f2] text-[#1a1a1a] flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="text-sm text-[#666] mb-2">Error loading data</div>
          <div className="text-xs text-[#999]">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#fafafa] text-[#1a1a1a] px-8 py-6 flex flex-col w-full mx-auto overflow-hidden">
      <DashboardHeader
        selectedType={selectedType}
        selectedCountry={selectedCountry}
        selectedWeek={selectedWeek}
        onClearFilters={clearFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Overview Dashboard */}
      {viewMode === "overview" && (
        <>
          <TypeMetrics data={filteredData} selectedType={selectedType} onTypeClick={handleTypeClick} />

          {/* Grid */}
          <div className="grid grid-cols-[48%_52%] gap-2 flex-1 min-h-0">
            {/* Left Column */}
            <div className="flex flex-col min-h-0 overflow-hidden">
              <div className="mb-2 pb-2 border-b border-[#e0e0e0]">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">
                    {timelineLayout === "feed" ? "Latest Stories" : "Event Timeline"}
                  </h2>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => setTimelineLayout(timelineLayout === "table" ? "feed" : "table")}
                      className="bg-white border border-[#1a1a1a] text-[#1a1a1a] px-2.5 py-1 text-xs font-medium hover:bg-[#1a1a1a] hover:text-white transition-all whitespace-nowrap"
                    >
                      {timelineLayout === "table" ? "Feed" : "Table"}
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="bg-white border border-[#1a1a1a] text-[#1a1a1a] px-2.5 py-1 text-xs font-medium hover:bg-[#1a1a1a] hover:text-white transition-all whitespace-nowrap"
                      title="Export filtered data to CSV"
                    >
                      Export
                    </button>
                  </div>
                </div>
                {timelineLayout === "feed" && (
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search stories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-[#e0e0e0] text-[#1a1a1a] pl-10 pr-3 py-[5px] text-sm placeholder-[#999] focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                )}
              </div>
              <div className="overflow-hidden flex flex-col flex-1 min-h-0 bg-[#fafafa]">
                {timelineLayout === "feed" ? (
                  <EventsFeed data={filteredAndSearchedData} highlightedRowIndex={highlightedRowIndex} />
                ) : (
                  <EventsTable
                    data={filteredAndSearchedData}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    highlightedRowIndex={highlightedRowIndex}
                  />
                )}
              </div>
            </div>

            {/* Right Column - Location Table and Strip Plot */}
            <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
              <LocationSection
                data={filteredData}
                isMapMode={isMapMode}
                onToggleMode={() => setIsMapMode(!isMapMode)}
                selectedCountry={selectedCountry}
                onCountryClick={handleCountryClick}
              />

              {/* Timeline */}
              <div className="flex flex-col min-h-0" style={{ flex: "0 1 40%" }}>
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e0e0]">
                  <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">Timeline</h2>
                  {zoomRange && (
                    <button
                      onClick={resetZoom}
                      className="text-xs px-2 py-1 bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#1a1a1a] rounded transition-colors"
                    >
                      Reset Zoom
                    </button>
                  )}
                </div>
                <div className="bg-[#fafafa] h-full min-h-[200px] max-h-[280px]">
                  <D3Timeline
                    data={stripPlotData}
                    startDate={defaultStartDate}
                    endDate={defaultEndDate}
                    onPointClick={handleTimelinePointClick}
                    onZoom={(start, end) => setZoomRange({ start, end })}
                    zoomRange={zoomRange}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Insights View */}
      {viewMode === "insights" && (
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa]">
          {config?.features?.insights?.comingSoon ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#1a1a1a] mb-2">Insights</h2>
                <p className="text-sm text-[#666]">Coming soon...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.map((insight) => (
                  <InsightCard
                    key={insight.slug}
                    title={insight.title}
                    subtitle={insight.subtitle}
                    content={insight.content}
                    onClick={() => setSelectedInsight(insight)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Modal for expanded card */}
          {selectedInsight && (
            <div
              className="fixed inset-0 flex items-center justify-center z-50 p-8 animate-fadeIn"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}
              onClick={() => setSelectedInsight(null)}
            >
              <div
                className="bg-white border border-[#e0e0e0] rounded p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative animate-zoomIn"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#1a1a1a] transition-colors"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>

                <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2 tracking-tight font-serif pr-8">
                  {selectedInsight.title}
                </h3>
                <p className="text-sm text-[#1a1a1a] mb-4 font-light">{selectedInsight.subtitle}</p>
                <p className="text-sm text-[#666] leading-relaxed whitespace-pre-wrap font-light">
                  {selectedInsight.content}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
