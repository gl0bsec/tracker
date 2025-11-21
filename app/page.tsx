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
import { InfoButton } from "@/components/info-button"
import { InfoModal } from "@/components/info-modal"
import { loadWidgetInfo } from "@/lib/markdown-loader"

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

  // Mobile view toggle state (timeline vs location)
  const [mobileView, setMobileView] = useState<"timeline" | "location">("timeline")

  // Info modal state
  const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null)

  const handleShowInfo = async (widgetId: string, title: string) => {
    const content = await loadWidgetInfo(widgetId)
    setInfoModal({ title, content })
  }

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

  // Apply date range filter from timeline zoom
  const dateFilteredData = useMemo(() => {
    if (!zoomRange) return filteredData

    return filteredData.filter((d) => {
      if (!d.parsed_first_event_date) return false
      return d.parsed_first_event_date >= zoomRange.start && d.parsed_first_event_date <= zoomRange.end
    })
  }, [filteredData, zoomRange])

  // Apply search and sort
  const filteredAndSearchedData = useEventSearch(dateFilteredData, { searchQuery, sortColumn, sortDirection })

  // Location data for mobile view (use date-filtered data for consistency)
  const locationByTypeData = useMemo(() => {
    const locationMap: Record<string, Record<string, number> & { goldsteinScores: number[] }> = {}

    dateFilteredData.forEach((d) => {
      d.event_locations_array.forEach((country) => {
        if (!locationMap[country]) {
          locationMap[country] = { ECON: 0, SEC: 0, DIP: 0, INFO: 0, total: 0, goldsteinScores: [] }
        }
        if (locationMap[country].hasOwnProperty(d.Type)) {
          locationMap[country][d.Type]++
          locationMap[country].total++
        }
        if (d.parsed_goldstein !== 0) {
          locationMap[country].goldsteinScores.push(d.parsed_goldstein)
        }
      })
    })

    return Object.entries(locationMap)
      .map(([location, counts]) => {
        const avgGoldstein =
          counts.goldsteinScores.length > 0
            ? counts.goldsteinScores.reduce((a, b) => a + b, 0) / counts.goldsteinScores.length
            : 0

        return {
          location,
          ECON: counts.ECON,
          SEC: counts.SEC,
          DIP: counts.DIP,
          INFO: counts.INFO,
          total: counts.total,
          avgGoldstein,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [dateFilteredData])

  // Filter data to only show events from June 2025 onward
  const stripPlotData = useMemo(() => {
    const minDate = new Date("2025-06-01")
    return filteredData
      .filter((d) => d.first_event_date && d.parsed_first_event_date >= minDate)
      .map((d) => ({
        type: d.Type,
        date: d.parsed_first_event_date,
        title: d.title || d["Event name"] || "Event",
        description: d.description || "No description available",
        eventData: d,
      }))
  }, [filteredData])

  // Dynamically calculate date range from data (starting from June 2025)
  const { defaultStartDate, defaultEndDate } = useMemo(() => {
    const minAllowedDate = new Date("2025-06-01")

    if (stripPlotData.length === 0) {
      return {
        defaultStartDate: minAllowedDate,
        defaultEndDate: new Date()
      }
    }

    const dates = stripPlotData.map(d => d.date.getTime())
    const maxDate = new Date(Math.max(...dates))

    // Always start from June 2025
    const startDate = minAllowedDate

    // Add a small buffer to end date (7 days)
    const endDate = new Date(maxDate)
    endDate.setDate(endDate.getDate() + 7)

    return { defaultStartDate: startDate, defaultEndDate: endDate }
  }, [stripPlotData])

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

  const handleZoom = (start: Date, end: Date) => {
    setZoomRange({ start, end })
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
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] px-3 py-3 md:px-6 md:py-5 lg:px-8 lg:py-6 lg:h-screen flex flex-col w-full mx-auto lg:overflow-hidden">
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
          <TypeMetrics
            data={filteredData}
            selectedType={selectedType}
            onTypeClick={handleTypeClick}
            onShowInfo={() => handleShowInfo("type-metrics", "Event Type Metrics")}
          />

          {/* Mobile: First Section - Timeline/Location (full viewport) */}
          <div className="mobile-section lg:hidden flex flex-col h-[45vh] min-h-[350px] pb-3">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e0e0]">
              <div className="flex items-center">
                <h2 className="text-xs font-bold text-[#1a1a1a] tracking-wide uppercase">
                  {mobileView === "timeline" ? "Timeline" : "By Location"}
                </h2>
                <InfoButton
                  onClick={() =>
                    handleShowInfo(
                      mobileView === "timeline" ? "timeline" : "by-location",
                      mobileView === "timeline" ? "Timeline" : "By Location"
                    )
                  }
                />
              </div>
              <div className="flex gap-2 items-center">
                {mobileView === "timeline" && zoomRange && (
                  <button
                    onClick={resetZoom}
                    className="text-xs px-3 py-1.5 bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#1a1a1a] rounded transition-colors"
                  >
                    Reset Zoom
                  </button>
                )}
                <div className="flex bg-gray-100 rounded overflow-hidden">
                  <button
                    onClick={() => setMobileView("timeline")}
                    className={`px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                      mobileView === "timeline"
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-transparent text-[#1a1a1a] hover:bg-gray-200"
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setMobileView("location")}
                    className={`px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                      mobileView === "location"
                        ? "bg-[#1a1a1a] text-white"
                        : "bg-transparent text-[#1a1a1a] hover:bg-gray-200"
                    }`}
                  >
                    Location
                  </button>
                </div>
              </div>
            </div>
            {mobileView === "timeline" ? (
              <div className="bg-[#fafafa] flex-1">
                <D3Timeline
                  data={stripPlotData}
                  startDate={defaultStartDate}
                  endDate={defaultEndDate}
                  onPointClick={handleTimelinePointClick}
                  onZoom={handleZoom}
                  zoomRange={zoomRange}
                />
              </div>
            ) : (
              <div className="bg-[#fafafa] flex-1 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#fafafa] sticky top-0 border-b-2 border-[#1a1a1a]">
                    <tr>
                      <th className="text-left px-2.5 py-1.5 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                        Location
                      </th>
                      <th className="text-center px-2.5 py-1.5 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                        Econ
                      </th>
                      <th className="text-center px-2.5 py-1.5 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                        Sec
                      </th>
                      <th className="text-center px-2.5 py-1.5 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                        Dip
                      </th>
                      <th className="text-center px-2.5 py-1.5 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                        Info
                      </th>
                      <th className="text-center px-2.5 py-1.5 font-bold text-[#1a1a1a] text-[10px] uppercase tracking-wide">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationByTypeData.map((row, i) => {
                      const isSelected = selectedCountry === row.location
                      return (
                        <tr
                          key={i}
                          onClick={() => handleCountryClick(row.location)}
                          className={`border-b border-[#e0e0e0] cursor-pointer transition-all ${
                            isSelected ? "bg-white" : "hover:bg-white"
                          }`}
                        >
                          <td
                            className={`px-2.5 py-1.5 text-[11px] ${isSelected ? "text-[#1a1a1a] font-bold" : "text-[#1a1a1a]"}`}
                          >
                            {config.countryMapping.inline[row.location] || row.location}
                          </td>
                          <td className="text-center px-2.5 py-1.5 text-[#666] text-[11px]">{row.ECON}</td>
                          <td className="text-center px-2.5 py-1.5 text-[#666] text-[11px]">{row.SEC}</td>
                          <td className="text-center px-2.5 py-1.5 text-[#666] text-[11px]">{row.DIP}</td>
                          <td className="text-center px-2.5 py-1.5 text-[#666] text-[11px]">{row.INFO}</td>
                          <td
                            className={`text-center px-2.5 py-1.5 font-bold text-[11px] ${
                              isSelected ? "text-[#1a1a1a]" : "text-[#1a1a1a]"
                            }`}
                          >
                            {row.total}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mobile: Second Section - Stories (full viewport) */}
          <div className="mobile-section lg:hidden flex flex-col h-[50vh] min-h-[400px]">
            <div className="mb-2 pb-2 border-b border-[#e0e0e0]">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <h2 className="text-xs font-bold text-[#1a1a1a] tracking-wide uppercase">
                    {timelineLayout === "feed" ? "Latest Stories" : "Event Timeline"}
                  </h2>
                  <InfoButton onClick={() => handleShowInfo("latest-stories", "Latest Stories")} />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex bg-gray-100 rounded overflow-hidden">
                    <button
                      onClick={() => setTimelineLayout("feed")}
                      className={`px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                        timelineLayout === "feed"
                          ? "bg-[#1a1a1a] text-white"
                          : "bg-transparent text-[#1a1a1a] hover:bg-gray-200"
                      }`}
                    >
                      Feed
                    </button>
                    <button
                      onClick={() => setTimelineLayout("table")}
                      className={`px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                        timelineLayout === "table"
                          ? "bg-[#1a1a1a] text-white"
                          : "bg-transparent text-[#1a1a1a] hover:bg-gray-200"
                      }`}
                    >
                      Table
                    </button>
                  </div>
                  <button
                    onClick={exportToCSV}
                    className="bg-white border border-[#1a1a1a] text-[#1a1a1a] px-3 py-1.5 text-xs font-medium hover:bg-[#1a1a1a] hover:text-white transition-all whitespace-nowrap"
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
                    className="w-full bg-white border border-[#e0e0e0] text-[#1a1a1a] pl-10 pr-3 py-1.5 text-sm placeholder-[#999] focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              )}
            </div>
            <div className="overflow-y-auto flex-1 bg-[#fafafa]">
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

          {/* Desktop: Grid with 2 columns */}
          <div className="hidden lg:grid lg:grid-cols-[48%_52%] lg:gap-2 flex-1 min-h-0">
            {/* Left Column */}
            <div className="flex flex-col min-h-0 overflow-hidden">
              <div className="mb-1.5 pb-1.5 md:mb-2 md:pb-2 border-b border-[#e0e0e0]">
                <div className="flex justify-between items-center mb-1.5 md:mb-2">
                  <div className="flex items-center">
                    <h2 className="text-sm md:text-base font-bold text-[#1a1a1a] tracking-tight">
                      {timelineLayout === "feed" ? "Latest Stories" : "Event Timeline"}
                    </h2>
                    <InfoButton onClick={() => handleShowInfo("latest-stories", "Latest Stories")} />
                  </div>
                  <div className="flex gap-1.5 md:gap-2 items-center">
                    <button
                      onClick={() => setTimelineLayout(timelineLayout === "table" ? "feed" : "table")}
                      className="bg-white border border-[#1a1a1a] text-[#1a1a1a] px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-medium hover:bg-[#1a1a1a] hover:text-white transition-all whitespace-nowrap"
                    >
                      {timelineLayout === "table" ? "Feed" : "Table"}
                    </button>
                    <button
                      onClick={exportToCSV}
                      className="bg-white border border-[#1a1a1a] text-[#1a1a1a] px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-medium hover:bg-[#1a1a1a] hover:text-white transition-all whitespace-nowrap"
                      title="Export filtered data to CSV"
                    >
                      Export
                    </button>
                  </div>
                </div>
                {timelineLayout === "feed" && (
                  <div className="relative">
                    <svg
                      className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-[#999]"
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
                      className="w-full bg-white border border-[#e0e0e0] text-[#1a1a1a] pl-8 md:pl-10 pr-2 md:pr-3 py-1 md:py-[5px] text-[11px] md:text-sm placeholder-[#999] focus:outline-none focus:border-[#1a1a1a]"
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
            <div className="hidden lg:flex flex-col gap-2 min-h-0 overflow-hidden">
              <LocationSection
                data={dateFilteredData}
                isMapMode={isMapMode}
                onToggleMode={() => setIsMapMode(!isMapMode)}
                selectedCountry={selectedCountry}
                onCountryClick={handleCountryClick}
                onShowInfo={() => handleShowInfo("by-location", "By Location")}
              />

              {/* Timeline */}
              <div className="flex flex-col min-h-[300px] lg:min-h-0 lg:flex-[0_1_40%]">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e0e0]">
                  <div className="flex items-center">
                    <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">Timeline</h2>
                    <InfoButton onClick={() => handleShowInfo("timeline", "Timeline")} />
                  </div>
                  {zoomRange && (
                    <button
                      onClick={resetZoom}
                      className="text-xs px-2 py-1 bg-[#e0e0e0] hover:bg-[#d0d0d0] text-[#1a1a1a] rounded transition-colors"
                    >
                      Reset Zoom
                    </button>
                  )}
                </div>
                <div className="bg-[#fafafa] h-full min-h-[200px] max-h-[250px] md:max-h-[280px]">
                  <D3Timeline
                    data={stripPlotData}
                    startDate={defaultStartDate}
                    endDate={defaultEndDate}
                    onPointClick={handleTimelinePointClick}
                    onZoom={handleZoom}
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

      {/* Info Modal */}
      {infoModal && <InfoModal title={infoModal.title} content={infoModal.content} onClose={() => setInfoModal(null)} />}
    </div>
  )
}
