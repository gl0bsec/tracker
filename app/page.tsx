"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import Papa from "papaparse"
import dynamic from "next/dynamic"
import { getCachedData, setCachedData } from "@/lib/data-cache"
import { loadConfig, getCountryName, getTypeConfig } from "@/lib/config-loader"
import { insights } from "@/lib/insights-client"
import { InsightCard } from "@/components/insight-card"

// Dynamically import Africa map to avoid SSR issues
const AfricaEventMap = dynamic(() => import("@/components/africa-event-map"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-[#a5a5a5] text-sm">Loading map...</div>,
})

// Dynamically import D3 timeline to avoid SSR issues
const D3Timeline = dynamic(() => import("@/components/d3-timeline"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-[#a5a5a5] text-sm">Loading timeline...</div>,
})

interface EventData {
  SOURCEURL: string
  Date: string
  "Event name": string
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

// Preprocessed version with parsed fields for performance
interface ProcessedEventData extends EventData {
  event_locations_array: string[]
  parsed_date: Date
  parsed_first_event_date: Date
  parsed_goldstein: number
}

const countryCodeMap: Record<string, string> = {
  AF: "Afghanistan",
  AL: "Albania",
  AG: "Algeria",
  AO: "Angola",
  AR: "Argentina",
  AM: "Armenia",
  AS: "Australia",
  AT: "Austria",
  AJ: "Azerbaijan",
  BF: "Bahamas, The",
  BA: "Bahrain",
  BG: "Bangladesh",
  BB: "Barbados",
  BO: "Belarus",
  BE: "Belgium",
  BH: "Belize",
  BN: "Benin",
  BT: "Bhutan",
  BL: "Bolivia",
  BK: "Bosnia-Herzegovina",
  BC: "Botswana",
  BR: "Brazil",
  BX: "Brunei",
  BU: "Bulgaria",
  UV: "Burkina Faso",
  BY: "Burundi",
  CB: "Cambodia",
  CM: "Cameroon",
  CA: "Canada",
  CV: "Cape Verde",
  CT: "Central African Republic",
  CD: "Chad",
  CI: "Chile",
  CH: "China",
  CO: "Colombia",
  CN: "Comoros",
  CF: "Congo",
  CG: "Democratic Republic of the Congo",
  CR: "Costa Rica",
  IV: "Cote dIvoire",
  HR: "Croatia",
  CU: "Cuba",
  CY: "Cyprus",
  EZ: "Czech Republic",
  DA: "Denmark",
  DJ: "Djibouti",
  DO: "Dominica",
  DR: "Dominican Republic",
  TT: "East Timor",
  EC: "Ecuador",
  EG: "Egypt",
  ES: "El Salvador",
  GV: "Equatorial Guinea",
  EK: "Equatorial Guinea",
  ER: "Eritrea",
  EN: "Estonia",
  ET: "Ethiopia",
  FJ: "Fiji",
  FI: "Finland",
  FR: "France",
  GB: "Gabon",
  GA: "Gambia",
  GZ: "Gaza Strip",
  GG: "Georgia",
  GM: "Germany",
  GH: "Ghana",
  GR: "Greece",
  GT: "Guatemala",
  GY: "Guyana",
  HA: "Haiti",
  HO: "Honduras",
  HK: "Hong Kong",
  HU: "Hungary",
  IC: "Iceland",
  IN: "India",
  ID: "Indonesia",
  IR: "Iran",
  IZ: "Iraq",
  EI: "Ireland",
  IS: "Israel",
  IT: "Italy",
  JM: "Jamaica",
  JA: "Japan",
  JO: "Jordan",
  KZ: "Kazakhstan",
  KE: "Kenya",
  KR: "Kiribati",
  KV: "Kosovo",
  KU: "Kuwait",
  KG: "Kyrgyzstan",
  LA: "Laos",
  LG: "Latvia",
  LE: "Lebanon",
  LT: "Lesotho",
  LI: "Liberia",
  LY: "Libya",
  LS: "Liechtenstein",
  LH: "Lithuania",
  LU: "Luxembourg",
  MC: "Macau",
  MK: "Macedonia",
  MA: "Madagascar",
  MI: "Malawi",
  MY: "Malaysia",
  MV: "Maldives",
  ML: "Mali",
  MT: "Malta",
  MR: "Mauritania",
  MP: "Mauritius",
  MX: "Mexico",
  FM: "Micronesia",
  MD: "Moldova",
  MN: "Monaco",
  MG: "Mongolia",
  MJ: "Montenegro",
  MO: "Morocco",
  MZ: "Mozambique",
  BM: "Myanmar",
  WA: "Namibia",
  NR: "Nauru",
  NP: "Nepal",
  NL: "Netherlands",
  NZ: "New Zealand",
  NU: "Nicaragua",
  NG: "Niger",
  NI: "Nigeria",
  KN: "North Korea",
  NO: "Norway",
  MU: "Oman",
  PK: "Pakistan",
  PS: "Palau",
  PM: "Panama",
  PP: "Papua New Guinea",
  PA: "Paraguay",
  PE: "Peru",
  RP: "Philippines",
  PL: "Poland",
  PO: "Portugal",
  QA: "Qatar",
  RO: "Romania",
  RS: "Russia",
  RW: "Rwanda",
  SA: "Saudi Arabia",
  SG: "Senegal",
  RI: "Serbia",
  SE: "Seychelles",
  SL: "Sierra Leone",
  SN: "Singapore",
  SI: "Slovenia",
  SO: "Somalia",
  SF: "South Africa",
  KS: "South Korea",
  OD: "South Sudan",
  SP: "Spain",
  CE: "Sri Lanka",
  SU: "Sudan",
  NS: "Suriname",
  WZ: "Swaziland",
  SW: "Sweden",
  SZ: "Switzerland",
  SY: "Syria",
  TW: "Taiwan",
  TI: "Tajikistan",
  TZ: "Tanzania",
  TH: "Thailand",
  TO: "Togo",
  TN: "Tonga",
  TD: "Trinidad and Tobago",
  TS: "Tunisia",
  TU: "Turkey",
  TX: "Turkmenistan",
  TV: "Tuvalu",
  UG: "Uganda",
  UP: "Ukraine",
  AE: "United Arab Emirates",
  UK: "United Kingdom",
  US: "United States",
  UY: "Uruguay",
  UZ: "Uzbekistan",
  NH: "Vanuatu",
  VT: "Vatican City",
  VE: "Venezuela",
  VM: "Vietnam, Democratic Republic of",
  YM: "Yemen",
  ZA: "Zambia",
  ZI: "Zimbabwe",
}

const typeLabels = {
  ECON: "Economic",
  SEC: "Security",
  DIP: "Diplomatic",
  INFO: "Information",
}

export default function Dashboard() {
  // Load configuration
  const config = useMemo(() => loadConfig(), [])

  const [data, setData] = useState<ProcessedEventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cross-filtering state
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isMapMode, setIsMapMode] = useState(true)
  const [timelineLayout, setTimelineLayout] = useState<"table" | "feed">("feed")

  const [columnWidths, setColumnWidths] = useState({
    date: 85,
    type: 70,
    title: 180,
    description: 300,
    source: 140,
  })

  const [resizing, setResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number | null>(null)

  // Timeline zoom state
  const [zoomRange, setZoomRange] = useState<{ start: Date; end: Date } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<"overview" | "insights">("overview")

  // Selected insight for modal
  const [selectedInsight, setSelectedInsight] = useState<typeof insights[0] | null>(null)

  // Handle column resize start
  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault()
    setResizing(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column as keyof typeof columnWidths])
  }

  // Handle column resize move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return

      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff) // Minimum width of 50px

      setColumnWidths((prev) => ({
        ...prev,
        [resizing]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      setResizing(null)
    }

    if (resizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizing, startX, startWidth])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Check cache first
        let text = getCachedData()

        // If not cached, fetch from network
        if (!text) {
          const response = await fetch(config.data.source.url)
          text = await response.text()

          // Cache the raw CSV text if caching is enabled
          if (config.data.source.caching.enabled) {
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
            const dateCol = config.data.columnMapping.date
            const typeCol = config.data.columnMapping.type
            return row[dateCol] && row[typeCol]
          })
          .map((row: EventData) => {
            // Preprocess for performance using config mappings
            const locationCol = config.data.columnMapping.eventLocations
            const dateCol = config.data.columnMapping.date
            const firstEventDateCol = config.data.columnMapping.firstEventDate
            const goldsteinCol = config.data.columnMapping.goldsteinScore

            const processed: ProcessedEventData = {
              ...row,
              // Split country codes once instead of on every filter
              event_locations_array: row[locationCol]
                ? row[locationCol].split(config.data.processing.locationDelimiter).map((c) => c.trim())
                : [],
              // Parse dates once
              parsed_date: new Date(row[dateCol]),
              parsed_first_event_date: new Date(row[firstEventDateCol]),
              // Parse Goldstein score once
              parsed_goldstein: parseFloat(row[goldsteinCol]) || 0,
            }
            return processed
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

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
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

  // Apply all filters in a single pass for better performance
  const filteredData = useMemo(() => {
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

  const filteredAndSearchedData = useMemo(() => {
    let result = [...filteredData]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (d) =>
          (d.title && d.title.toLowerCase().includes(query)) ||
          (d.description && d.description.toLowerCase().includes(query)) ||
          (d["Event name"] && d["Event name"].toLowerCase().includes(query)),
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
  }, [filteredData, searchQuery, sortColumn, sortDirection])

  // Compute metrics based on filtered data
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { ECON: 0, SEC: 0, DIP: 0, INFO: 0 }
    filteredData.forEach((d) => {
      if (counts.hasOwnProperty(d.Type)) {
        counts[d.Type]++
      }
    })
    return counts
  }, [filteredData])

  const locationByTypeData = useMemo(() => {
    const locationMap: Record<string, Record<string, number> & { goldsteinScores: number[] }> = {}

    filteredData.forEach((d) => {
      // Use preprocessed arrays and scores for better performance
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
  }, [filteredData])

  const stripPlotData = useMemo(() => {
    return filteredData
      .filter((d) => d.first_event_date)
      .map((d) => ({
        type: d.Type,
        date: d.parsed_first_event_date, // Use preprocessed date
        title: d.title || d["Event name"] || "Event",
        description: d.description || "No description available",
        eventData: d,
      }))
  }, [filteredData])

  const defaultStartDate = new Date("2025-06-01")
  const defaultEndDate = new Date("2025-10-05")
  const startDate = zoomRange?.start || defaultStartDate
  const endDate = zoomRange?.end || defaultEndDate

  // Generate month labels based on current date range
  const monthLabels = useMemo(() => {
    if (!zoomRange) return ["Jun", "Jul", "Aug", "Sep", "Oct"]

    const months = []
    const current = new Date(startDate)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    // For zoomed ranges, show more granular labels
    const rangeMs = endDate.getTime() - startDate.getTime()
    const rangeDays = rangeMs / (1000 * 60 * 60 * 24)

    if (rangeDays < 14) {
      // Show dates for very zoomed in view
      const dayCount = Math.ceil(rangeDays)
      for (let i = 0; i <= Math.min(dayCount, 10); i++) {
        const date = new Date(startDate.getTime() + (i / Math.min(dayCount, 10)) * rangeMs)
        months.push(`${monthNames[date.getMonth()]} ${date.getDate()}`)
      }
    } else if (rangeDays < 60) {
      // Show weeks
      const weekCount = Math.ceil(rangeDays / 7)
      for (let i = 0; i <= Math.min(weekCount, 8); i++) {
        const date = new Date(startDate.getTime() + (i / Math.min(weekCount, 8)) * rangeMs)
        months.push(`${monthNames[date.getMonth()]} ${date.getDate()}`)
      }
    } else {
      // Show months
      while (current <= endDate) {
        const monthKey = `${monthNames[current.getMonth()]}`
        months.push(monthKey)
        current.setMonth(current.getMonth() + 1)
      }
    }

    return months.length > 0 ? months : ["Jun", "Jul", "Aug", "Sep", "Oct"]
  }, [startDate, endDate, zoomRange])

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

  // Handle timeline drag selection for zoom
  const handleTimelineMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Only start drag if within the plot area (x between 80 and 600)
    if (x >= 80 && x <= 600) {
      setIsDragging(true)
      setDragStart(x)
      setDragEnd(x)
    }
  }

  const handleTimelineMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || dragStart === null) return

    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = e.clientX - rect.left

    // Clamp x to plot area
    const clampedX = Math.max(80, Math.min(600, x))
    setDragEnd(clampedX)
  }

  const handleTimelineMouseUp = () => {
    if (!isDragging || dragStart === null || dragEnd === null) {
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }

    const minX = Math.min(dragStart, dragEnd)
    const maxX = Math.max(dragStart, dragEnd)

    // Only zoom if drag distance is meaningful (more than 10 pixels)
    if (maxX - minX > 10) {
      // Convert x coordinates to dates
      const plotWidth = 520
      const plotStart = 80

      const minRatio = (minX - plotStart) / plotWidth
      const maxRatio = (maxX - plotStart) / plotWidth

      const currentStartDate = zoomRange?.start || defaultStartDate
      const currentEndDate = zoomRange?.end || defaultEndDate
      const totalMs = currentEndDate.getTime() - currentStartDate.getTime()

      const newStartDate = new Date(currentStartDate.getTime() + minRatio * totalMs)
      const newEndDate = new Date(currentStartDate.getTime() + maxRatio * totalMs)

      setZoomRange({ start: newStartDate, end: newEndDate })
    }

    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }

  const handleTypeClick = (type: string) => {
    setSelectedType(selectedType === type ? null : type)
  }

  const handleCountryClick = (code: string) => {
    setSelectedCountry(selectedCountry === code ? null : code)
  }

  const handleTimelinePointClick = (eventData: EventData) => {
    // Find the index of this event in the filtered and searched data
    const rowIndex = filteredAndSearchedData.findIndex((e) =>
      e.Date === eventData.Date &&
      e.title === eventData.title &&
      e.Type === eventData.Type
    )

    if (rowIndex !== -1) {
      // Scroll to the row
      const rowElement = document.querySelector(`#event-row-${rowIndex}`)
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }

      // Highlight the row
      setHighlightedRowIndex(rowIndex)

      // Remove highlight after 1 second
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
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-[#e0e0e0] flex-shrink-0 min-w-0">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h1 className="text-[26px] font-bold mb-0.5 tracking-tight text-[#1a1a1a] font-serif">
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
              onClick={() => setViewMode("overview")}
              className={`relative z-10 px-4 text-xs font-semibold transition-colors duration-300 ${
                viewMode === "overview" ? "text-[#fafafa]" : "text-[#1a1a1a]"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode("insights")}
              className={`relative z-10 px-4 text-xs font-semibold transition-colors duration-300 ${
                viewMode === "insights" ? "text-[#fafafa]" : "text-[#1a1a1a]"
              }`}
            >
              Insights
            </button>
          </div>
        </div>
        <div>
          {(selectedType || selectedCountry || selectedWeek) && (
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
              <button
                onClick={clearFilters}
                className="text-[10px] text-[#666] hover:text-[#1a1a1a] underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Overview Dashboard */}
      {viewMode === "overview" && (
        <>
          {/* Type Metrics */}
          <div className="grid grid-cols-4 gap-4 mb-6 flex-shrink-0 min-w-0">
        {Object.entries(typeCounts).map(([type, count]) => {
          const typeConfig = getTypeConfig(type, config)
          if (!typeConfig) return null

          const isSelected = selectedType === type
          return (
            <div
              key={type}
              onClick={() => handleTypeClick(type)}
              className={`border-l pl-3 py-1 cursor-pointer transition-all min-w-0 overflow-hidden ${
                isSelected ? "border-[#1a1a1a]" : "border-[#d0d0d0] hover:border-[#999]"
              }`}
              style={{
                borderLeftColor: isSelected ? typeConfig.color : undefined,
              }}
            >
              <div
                className="text-[10px] mb-0.5 uppercase tracking-wide font-semibold truncate"
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
              /* News Feed Layout */
              <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className="w-full max-w-full">
                  <div className="mb-3 text-xs text-[#666]">{filteredAndSearchedData.length} stories</div>
                  {filteredAndSearchedData.map((event, i) => {
                    const typeConfig = getTypeConfig(event.Type, config)
                    const eventDate = event.Date ? new Date(event.Date) : null
                    const formattedDate = eventDate
                      ? eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "N/A"

                    // Extract country names from event_locations_array
                    const countries = event.event_locations_array
                      .map(code => ({ code, name: getCountryName(code, config) }))
                      .filter(item => item.name !== item.code) // Filter out unmapped codes
                      .map(item => item.name)
                      .slice(0, 1) // Show only first country

                    return (
                      <div
                        key={i}
                        id={`event-row-${i}`}
                        className={`mb-4 pb-4 border-b border-[#e0e0e0] last:border-b-0 transition-colors ${
                          highlightedRowIndex === i ? "bg-white -mx-2 px-2 py-2" : ""
                        }`}
                      >
                        {/* Category and Date */}
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: typeConfig?.color || "#1a1a1a" }}
                          >
                            {typeConfig?.label?.replace(/\s*\(.*?\)\s*/g, '') || event.Type}
                          </span>
                          <span className="text-[#999]">·</span>
                          <span className="text-[10px] text-[#666]">{formattedDate}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[15px] font-semibold mb-2 leading-snug">
                          <a
                            href={event.SOURCEURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a1a1a] hover:underline"
                          >
                            {event.title || "N/A"}
                          </a>
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-[#666] leading-relaxed mb-2 line-clamp-3">
                          {event.description || "No description available"}
                        </p>

                        {/* Footer: Country and Source */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[#666] font-semibold">
                            {countries.length > 0 ? countries[0] : "Unknown"}
                          </span>
                          <a
                            href={event.SOURCEURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1a1a1a] font-medium hover:underline"
                          >
                            {event.site_name || "Link"}
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Original Table Layout */
              <div className="flex-1 overflow-y-auto overflow-x-auto">
                <table className="w-full text-[11px]">
                <thead className="bg-[#fafafa] sticky top-0 border-b-2 border-[#1a1a1a]">
                  <tr>
                    <th
                      className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide relative cursor-pointer hover:text-[#666] transition-colors select-none"
                      style={{ width: columnWidths.date }}
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortColumn === "date" && (
                          <span className="text-[#1a1a1a]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#1a1a1a] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "date")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide relative cursor-pointer hover:text-[#666] transition-colors select-none"
                      style={{ width: columnWidths.type }}
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        {sortColumn === "type" && (
                          <span className="text-[#1a1a1a]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#1a1a1a] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "type")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide relative cursor-pointer hover:text-[#666] transition-colors select-none"
                      style={{ width: columnWidths.title }}
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-1">
                        Title
                        {sortColumn === "title" && (
                          <span className="text-[#1a1a1a]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#1a1a1a] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "title")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide relative cursor-pointer hover:text-[#666] transition-colors select-none"
                      style={{ width: columnWidths.description }}
                      onClick={() => handleSort("description")}
                    >
                      <div className="flex items-center gap-1">
                        Description
                        {sortColumn === "description" && (
                          <span className="text-[#1a1a1a]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#1a1a1a] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "description")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide relative cursor-pointer hover:text-[#666] transition-colors select-none"
                      style={{ width: columnWidths.source }}
                      onClick={() => handleSort("source")}
                    >
                      <div className="flex items-center gap-1">
                        Source
                        {sortColumn === "source" && (
                          <span className="text-[#1a1a1a]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#1a1a1a] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "source")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSearchedData.map((event, i) => (
                    <tr
                      key={i}
                      id={`event-row-${i}`}
                      className={`border-b border-[#e0e0e0] transition-colors ${
                        highlightedRowIndex === i ? "bg-white" : "hover:bg-white"
                      }`}
                    >
                      <td
                        className="px-2.5 py-2 text-[#666] whitespace-nowrap text-xs"
                        style={{ width: columnWidths.date }}
                      >
                        {event.Date
                          ? new Date(event.Date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="px-2.5 py-2" style={{ width: columnWidths.type }}>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            color: event.Type === "ECON" ? "#f97316" :
                                   event.Type === "SEC" ? "#ef4444" :
                                   event.Type === "DIP" ? "#d4a017" :
                                   event.Type === "INFO" ? "#4a9eff" : "#1a1a1a"
                          }}
                        >
                          {event.Type}
                        </span>
                      </td>
                      <td className="px-2.5 py-2 text-[#1a1a1a] leading-tight text-[13.5px]" style={{ width: columnWidths.title }}>
                        <div className="line-clamp-2 font-semibold">{event.title || "N/A"}</div>
                      </td>
                      <td className="px-2.5 py-2 text-[#666] leading-tight text-xs" style={{ width: columnWidths.description }}>
                        <div className="line-clamp-2">{event.description || "N/A"}</div>
                      </td>
                      <td className="px-2.5 py-2" style={{ width: columnWidths.source }}>
                        <a
                          href={event.SOURCEURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1a1a1a] hover:underline text-[10px] leading-tight block underline"
                          title={event.SOURCEURL}
                        >
                          <div className="line-clamp-1 break-all">Link</div>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 text-center text-[#666] text-xs bg-[#fafafa] border-t-2 border-[#e0e0e0]">
                {filteredAndSearchedData.length} events
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Right Column - Location Table and Strip Plot */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
          {/* By Location - now first - takes 60% of vertical space */}
          <div className="flex flex-col min-h-0" style={{ flex: "0 1 60%" }}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e0e0]">
              <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">
                By Location
              </h2>
              <button
                onClick={() => setIsMapMode(!isMapMode)}
                className="bg-white border border-[#1a1a1a] text-[#1a1a1a] px-2.5 py-1 text-xs font-medium hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                {isMapMode ? "Table" : "Map"}
              </button>
            </div>
            <div className="overflow-hidden bg-[#fafafa] flex-1 min-h-0">
              {isMapMode ? (
                <div className="h-full">
                  <AfricaEventMap
                    countryData={Object.fromEntries(
                      locationByTypeData.map((row) => [row.location, { count: row.total, avgGoldstein: row.avgGoldstein }])
                    )}
                    selectedCountry={selectedCountry}
                    onCountryClick={handleCountryClick}
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  <table className="w-full text-xs">
                  <thead className="bg-[#fafafa] sticky top-0 border-b-2 border-[#1a1a1a]">
                    <tr>
                      <th className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">Location</th>
                      <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">Econ</th>
                      <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">Sec</th>
                      <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">Dip</th>
                      <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">Info</th>
                      <th className="text-center px-2.5 py-2 font-bold text-[#1a1a1a] text-[10px] uppercase tracking-wide">Total</th>
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
                          <td className={`px-2.5 py-2 text-xs ${isSelected ? "text-[#1a1a1a] font-bold" : "text-[#1a1a1a]"}`}>
                            {countryCodeMap[row.location] || row.location}
                          </td>
                          <td className="text-center px-2.5 py-2 text-[#666] text-xs">{row.ECON}</td>
                          <td className="text-center px-2.5 py-2 text-[#666] text-xs">{row.SEC}</td>
                          <td className="text-center px-2.5 py-2 text-[#666] text-xs">{row.DIP}</td>
                          <td className="text-center px-2.5 py-2 text-[#666] text-xs">{row.INFO}</td>
                          <td
                            className={`text-center px-2.5 py-2 font-bold text-xs ${isSelected ? "text-[#1a1a1a]" : "text-[#1a1a1a]"}`}
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
          </div>

          {/* Timeline - now second - takes 40% of vertical space */}
          <div className="flex flex-col min-h-0" style={{ flex: "0 1 40%" }}>
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e0e0]">
              <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">
                Timeline
              </h2>
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
              {/* Grid Layout */}
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
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
              onClick={() => setSelectedInsight(null)}
            >
              <div
                className="bg-white border border-[#e0e0e0] rounded p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative animate-zoomIn"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="absolute top-6 right-6 w-6 h-6 flex items-center justify-center text-[#999] hover:text-[#1a1a1a] transition-colors"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Card content */}
                <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2 tracking-tight font-serif pr-8">
                  {selectedInsight.title}
                </h3>
                <p className="text-sm text-[#1a1a1a] mb-4 font-light">
                  {selectedInsight.subtitle}
                </p>
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
