"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import type { ProcessedEventData } from "@/lib/types/events"
import { countryCodeMap } from "@/lib/data/country-codes"

const AfricaEventMap = dynamic(() => import("@/components/africa-event-map"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-[#a5a5a5] text-sm">Loading map...</div>,
})

interface LocationSectionProps {
  data: ProcessedEventData[]
  isMapMode: boolean
  onToggleMode: () => void
  selectedCountry: string | null
  onCountryClick: (code: string) => void
}

export function LocationSection({ data, isMapMode, onToggleMode, selectedCountry, onCountryClick }: LocationSectionProps) {
  const locationByTypeData = useMemo(() => {
    const locationMap: Record<string, Record<string, number> & { goldsteinScores: number[] }> = {}

    data.forEach((d) => {
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
  }, [data])

  return (
    <div className="flex flex-col min-h-0" style={{ flex: "0 1 60%" }}>
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e0e0e0]">
        <h2 className="text-base font-bold text-[#1a1a1a] tracking-tight">By Location</h2>
        <button
          onClick={onToggleMode}
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
              onCountryClick={onCountryClick}
            />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#fafafa] sticky top-0 border-b-2 border-[#1a1a1a]">
                <tr>
                  <th className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                    Location
                  </th>
                  <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                    Econ
                  </th>
                  <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                    Sec
                  </th>
                  <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                    Dip
                  </th>
                  <th className="text-center px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide">
                    Info
                  </th>
                  <th className="text-center px-2.5 py-2 font-bold text-[#1a1a1a] text-[10px] uppercase tracking-wide">
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
                      onClick={() => onCountryClick(row.location)}
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
                        className={`text-center px-2.5 py-2 font-bold text-xs ${
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
    </div>
  )
}
