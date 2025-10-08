"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import Papa from "papaparse"

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
  const [data, setData] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cross-filtering state
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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
        const response = await fetch(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Russia%20in%20africa%20tracker%20-%20Timeline%20w%20metadata%20%28filled%20from%20news%29-uLP1Ocyo4s6GfKGK40nb04pGjJlwCy.csv",
        )
        const text = await response.text()

        const parsed = Papa.parse(text, {
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
        })

        const cleanData = parsed.data
          .map((row: any) => {
            const cleanRow: any = {}
            Object.keys(row).forEach((key) => {
              cleanRow[key.trim()] = row[key]
            })
            return cleanRow
          })
          .filter((row: any) => row.Date && row.Type) as EventData[]

        setData(cleanData)
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

  // Apply all filters in sequence
  const filteredData = useMemo(() => {
    let filtered = [...data]

    filtered = filtered.filter((d) => d.title && d.title.trim() !== "" && d.title !== "N/A")

    if (selectedType) {
      filtered = filtered.filter((d) => d.Type === selectedType)
    }

    if (selectedCountry) {
      filtered = filtered.filter((d) => d.event_locations && d.event_locations.includes(selectedCountry))
    }

    if (selectedWeek) {
      filtered = filtered.filter((d) => {
        const date = new Date(d.first_event_date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekKey = weekStart.toISOString().split("T")[0]
        return weekKey === selectedWeek
      })
    }

    return filtered
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
            aVal = new Date(a.Date).getTime()
            bVal = new Date(b.Date).getTime()
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
    const locationMap: Record<string, Record<string, number>> = {}

    filteredData.forEach((d) => {
      if (d.event_locations) {
        const countries = d.event_locations.split("|").map((c) => c.trim())
        countries.forEach((country) => {
          if (!locationMap[country]) {
            locationMap[country] = { ECON: 0, SEC: 0, DIP: 0, INFO: 0, total: 0 }
          }
          if (locationMap[country].hasOwnProperty(d.Type)) {
            locationMap[country][d.Type]++
            locationMap[country].total++
          }
        })
      }
    })

    return Object.entries(locationMap)
      .map(([location, counts]) => ({
        location,
        ...counts,
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredData])

  const stripPlotData = useMemo(() => {
    return filteredData
      .filter((d) => d.first_event_date)
      .map((d) => ({
        type: d.Type,
        date: new Date(d.first_event_date),
        title: d.title || d["Event name"] || "Event",
        description: d.description || "No description available",
      }))
  }, [filteredData])

  const startDate = new Date("2025-06-01")
  const endDate = new Date("2025-10-05")
  const monthLabels = ["Jun", "Jul", "Aug", "Sep", "Oct"]

  const clearFilters = () => {
    setSelectedType(null)
    setSelectedCountry(null)
    setSelectedWeek(null)
    setSearchQuery("")
    setSortColumn(null)
  }

  const handleTypeClick = (type: string) => {
    setSelectedType(selectedType === type ? null : type)
  }

  const handleCountryClick = (code: string) => {
    setSelectedCountry(selectedCountry === code ? null : code)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2a2d32] text-white flex items-center justify-center">
        <div className="text-sm text-[#a5a5a5]">Loading data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#2a2d32] text-white flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          <div className="text-sm text-[#a5a5a5] mb-2">Error loading data</div>
          <div className="text-xs text-[#666]">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#2a2d32] text-white p-4 flex flex-col">
      {/* Header */}
      <div className="mb-2 flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold mb-0 tracking-tight">What's Russia doing in Africa? (demo)</h1>
          {(selectedType || selectedCountry || selectedWeek) && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {selectedType && (
                <span className="bg-[#383838] px-2 py-0.5 rounded text-[10px] text-[#4a9eff]">
                  Type: {typeLabels[selectedType as keyof typeof typeLabels]}
                </span>
              )}
              {selectedCountry && (
                <span className="bg-[#383838] px-2 py-0.5 rounded text-[10px] text-[#4a9eff]">
                  Country: {countryCodeMap[selectedCountry] || selectedCountry}
                </span>
              )}
              {selectedWeek && (
                <span className="bg-[#383838] px-2 py-0.5 rounded text-[10px] text-[#4a9eff]">
                  Week: {new Date(selectedWeek).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
        {(selectedType || selectedCountry || selectedWeek) && (
          <button
            onClick={clearFilters}
            className="bg-transparent border border-[#4a4a4a] text-[#a5a5a5] px-3 py-1 rounded text-xs hover:border-[#4a9eff] hover:text-[#4a9eff] transition-all"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Type Metrics */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Object.entries(typeCounts).map(([type, count]) => (
          <div
            key={type}
            onClick={() => handleTypeClick(type)}
            className={`bg-transparent py-1.5 cursor-pointer transition-all ${
              selectedType === type ? "border-b-2 border-[#4a9eff]" : "border-b border-[#383838] hover:border-[#4a4a4a]"
            }`}
          >
            <div className="text-[9px] text-[#a5a5a5] mb-0.5 uppercase tracking-wide">
              {typeLabels[type as keyof typeof typeLabels]}
            </div>
            <div
              className={`text-xl font-light tracking-tight ${selectedType === type ? "text-[#4a9eff]" : "text-white"}`}
            >
              {count}
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[55%_45%] gap-4">
        {/* Left Column */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2 gap-2">
            <h3 className="text-[10px] font-medium text-[#a5a5a5] uppercase tracking-wide">Events Data</h3>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#333638] border border-[#383838] text-white px-2 py-1 rounded text-[10px] placeholder-[#666] focus:outline-none focus:border-[#4a9eff] w-48"
              />
              <button
                onClick={exportToCSV}
                className="bg-transparent border border-[#4a4a4a] text-[#a5a5a5] px-2 py-1 rounded text-[10px] hover:border-[#4a9eff] hover:text-[#4a9eff] transition-all whitespace-nowrap"
                title="Export filtered data to CSV"
              >
                Export CSV
              </button>
            </div>
          </div>
          <div className="border border-[#383838] rounded overflow-hidden flex flex-col max-h-[774px]">
            <div className="flex-1 overflow-y-auto overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-[#333638] sticky top-0">
                  <tr>
                    <th
                      className="text-left p-1 text-[#a5a5a5] font-medium relative cursor-pointer hover:text-[#4a9eff] transition-colors select-none"
                      style={{ width: columnWidths.date }}
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortColumn === "date" && (
                          <span className="text-[#4a9eff]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4a9eff] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "date")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left p-1 text-[#a5a5a5] font-medium relative cursor-pointer hover:text-[#4a9eff] transition-colors select-none"
                      style={{ width: columnWidths.type }}
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        {sortColumn === "type" && (
                          <span className="text-[#4a9eff]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4a9eff] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "type")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left p-1 text-[#a5a5a5] font-medium relative cursor-pointer hover:text-[#4a9eff] transition-colors select-none"
                      style={{ width: columnWidths.title }}
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-1">
                        Title
                        {sortColumn === "title" && (
                          <span className="text-[#4a9eff]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4a9eff] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "title")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left p-1 text-[#a5a5a5] font-medium relative cursor-pointer hover:text-[#4a9eff] transition-colors select-none"
                      style={{ width: columnWidths.description }}
                      onClick={() => handleSort("description")}
                    >
                      <div className="flex items-center gap-1">
                        Description
                        {sortColumn === "description" && (
                          <span className="text-[#4a9eff]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4a9eff] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "description")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                    <th
                      className="text-left p-1 text-[#a5a5a5] font-medium relative cursor-pointer hover:text-[#4a9eff] transition-colors select-none"
                      style={{ width: columnWidths.source }}
                      onClick={() => handleSort("source")}
                    >
                      <div className="flex items-center gap-1">
                        Source URL
                        {sortColumn === "source" && (
                          <span className="text-[#4a9eff]">{sortDirection === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4a9eff] transition-colors"
                        onMouseDown={(e) => handleResizeStart(e, "source")}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSearchedData.map((event, i) => (
                    <tr key={i} className="border-t border-[#383838] hover:bg-[#333638]">
                      <td
                        className="p-1 text-[#a5a5a5] whitespace-nowrap text-[10px]"
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
                      <td className="p-1" style={{ width: columnWidths.type }}>
                        <span className="bg-[#383838] px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap">
                          {typeLabels[event.Type as keyof typeof typeLabels] || event.Type}
                        </span>
                      </td>
                      <td className="p-1 text-white leading-tight" style={{ width: columnWidths.title }}>
                        <div className="line-clamp-3">{event.title || "N/A"}</div>
                      </td>
                      <td className="p-1 text-[#a5a5a5] leading-tight" style={{ width: columnWidths.description }}>
                        <div className="line-clamp-3">{event.description || "N/A"}</div>
                      </td>
                      <td className="p-1" style={{ width: columnWidths.source }}>
                        <a
                          href={event.SOURCEURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4a9eff] hover:underline text-[10px] leading-tight block"
                          title={event.SOURCEURL}
                        >
                          <div className="line-clamp-2 break-all">{event.SOURCEURL}</div>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-1 text-center text-[#a5a5a5] text-[10px] bg-[#333638] border-t border-[#383838]">
              Showing {filteredAndSearchedData.length} events
              {searchQuery && ` (filtered by search)`}
            </div>
          </div>
        </div>

        {/* Right Column - Strip Plot and Location Table */}
        <div className="flex flex-col gap-4">
          {/* Strip Plot */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[10px] font-medium text-[#a5a5a5] uppercase tracking-wide">
                Timeline by Type (Jun - Oct 2025)
              </h3>
              <div className="flex gap-3">
                {[
                  { type: "ECON", color: "#f97316", label: "Econ" },
                  { type: "SEC", color: "#ef4444", label: "Sec" },
                  { type: "DIP", color: "#ffd93d", label: "Dip" },
                  { type: "INFO", color: "#4a9eff", label: "Info" },
                ].map(({ type, color, label }) => (
                  <div key={type} className="flex items-center gap-1">
                    <div className="w-2 h-2 opacity-80" style={{ background: color }} />
                    <span className="text-[9px] text-[#a5a5a5]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-[#383838] rounded overflow-hidden">
              <svg
                width="100%"
                height="280"
                viewBox="0 0 620 310"
                preserveAspectRatio="xMidYMid meet"
                className="overflow-visible"
              >
                <defs>
                  <pattern id="grid" width="100" height="70" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="280" stroke="#383838" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>

                {/* Background grid */}
                <rect x="80" y="0" width="520" height="280" fill="url(#grid)" />

                {/* Horizontal lines for each type */}
                {["ECON", "SEC", "DIP", "INFO"].map((type, i) => {
                  const y = i * 70 + 35
                  return (
                    <g key={type}>
                      <line x1="60" x2="600" y1={y} y2={y} stroke="#383838" strokeWidth="1" />
                      <text x="10" y={y + 4} fill="#ffffff" fontSize="11" fontWeight="500" dominantBaseline="middle">
                        {type}
                      </text>
                    </g>
                  )
                })}

                {/* Vertical grid lines for months */}
                {monthLabels.map((month, i) => {
                  const x = 80 + (i / (monthLabels.length - 1)) * 520
                  return (
                    <line
                      key={`vline-${i}`}
                      x1={x}
                      y1="0"
                      x2={x}
                      y2="280"
                      stroke="#383838"
                      strokeWidth="0.5"
                      opacity="0.5"
                    />
                  )
                })}

                {/* X-axis labels */}
                {monthLabels.map((month, i) => {
                  const x = 80 + (i / (monthLabels.length - 1)) * 520
                  return (
                    <text key={month + i} x={x} y="295" fill="#a5a5a5" fontSize="10" textAnchor="middle">
                      {month}
                    </text>
                  )
                })}

                {/* X-axis label */}
                <text x="340" y="310" fill="#ffffff" fontSize="11" textAnchor="middle" fontWeight="500">
                  Date
                </text>

                {/* Data points as squares */}
                {stripPlotData.map((d, i) => {
                  const typeIndex = ["ECON", "SEC", "DIP", "INFO"].indexOf(d.type)
                  if (typeIndex === -1) return null

                  if (d.date < startDate || d.date > endDate) return null

                  // Calculate y position with slight jitter
                  const baseY = typeIndex * 70 + 35
                  const jitter = (Math.random() - 0.5) * 20
                  const y = baseY + jitter

                  // Calculate x position
                  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                  const daysSinceStart = (d.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                  const x = 80 + (daysSinceStart / totalDays) * 520

                  const typeColors: Record<string, string> = {
                    ECON: "#f97316",
                    SEC: "#ef4444",
                    DIP: "#ffd93d",
                    INFO: "#4a9eff",
                  }

                  const squareSize = 5

                  return (
                    <rect
                      key={i}
                      x={x - squareSize / 2}
                      y={y - squareSize / 2}
                      width={squareSize}
                      height={squareSize}
                      fill={typeColors[d.type]}
                      opacity="0.7"
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                    >
                      <title>
                        {d.title}
                        {"\n"}
                        {d.date.toLocaleDateString()}
                        {"\n\n"}
                        {d.description}
                      </title>
                    </rect>
                  )
                })}
              </svg>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-medium mb-2 text-[#a5a5a5] uppercase tracking-wide">
              Events by Location and Type (Click to Filter)
            </h3>
            <div className="border border-[#383838] rounded overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#333638] sticky top-0">
                    <tr>
                      <th className="text-left p-1.5 text-[#a5a5a5] font-medium">Location</th>
                      <th className="text-center p-1.5 text-[#a5a5a5] font-medium">Econ</th>
                      <th className="text-center p-1.5 text-[#a5a5a5] font-medium">Sec</th>
                      <th className="text-center p-1.5 text-[#a5a5a5] font-medium">Dip</th>
                      <th className="text-center p-1.5 text-[#a5a5a5] font-medium">Info</th>
                      <th className="text-center p-1.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationByTypeData.map((row, i) => {
                      const isSelected = selectedCountry === row.location
                      return (
                        <tr
                          key={i}
                          onClick={() => handleCountryClick(row.location)}
                          className={`border-t border-[#383838] cursor-pointer transition-all ${
                            isSelected ? "bg-[#3a3a3a]" : "hover:bg-[#333638]"
                          }`}
                        >
                          <td className={`p-1.5 ${isSelected ? "text-[#4a9eff]" : "text-white"}`}>
                            {countryCodeMap[row.location] || row.location}
                          </td>
                          <td className="text-center p-1.5 text-[#a5a5a5]">{row.ECON}</td>
                          <td className="text-center p-1.5 text-[#a5a5a5]">{row.SEC}</td>
                          <td className="text-center p-1.5 text-[#a5a5a5]">{row.DIP}</td>
                          <td className="text-center p-1.5 text-[#a5a5a5]">{row.INFO}</td>
                          <td
                            className={`text-center p-1.5 font-medium ${isSelected ? "text-[#4a9eff]" : "text-white"}`}
                          >
                            {row.total}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
