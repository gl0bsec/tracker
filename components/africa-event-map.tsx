"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"

interface AfricaEventMapProps {
  countryData: Record<string, { count: number; avgGoldstein: number }>
  selectedCountry: string | null
  onCountryClick: (code: string) => void
}

// African country coordinates (capital cities as reference points)
const countryCoordinates: Record<string, { name: string; lat: number; lon: number }> = {
  // North Africa
  AG: { name: "Algeria", lat: 28.0, lon: 3.0 },
  EG: { name: "Egypt", lat: 26.0, lon: 30.0 },
  LY: { name: "Libya", lat: 27.0, lon: 17.0 },
  MO: { name: "Morocco", lat: 32.0, lon: -6.0 },
  TS: { name: "Tunisia", lat: 34.0, lon: 9.0 },
  SU: { name: "Sudan", lat: 15.0, lon: 30.0 },
  OD: { name: "South Sudan", lat: 7.0, lon: 30.0 },

  // West Africa
  BN: { name: "Benin", lat: 9.5, lon: 2.25 },
  UV: { name: "Burkina Faso", lat: 12.3, lon: -1.5 },
  CV: { name: "Cape Verde", lat: 15.0, lon: -24.0 },
  IV: { name: "Côte d'Ivoire", lat: 7.5, lon: -5.5 },
  GA: { name: "Gambia", lat: 13.5, lon: -15.5 },
  GH: { name: "Ghana", lat: 8.0, lon: -2.0 },
  GN: { name: "Guinea", lat: 10.0, lon: -10.0 },
  GW: { name: "Guinea-Bissau", lat: 12.0, lon: -15.0 },
  LI: { name: "Liberia", lat: 6.5, lon: -9.5 },
  ML: { name: "Mali", lat: 17.0, lon: -4.0 },
  MR: { name: "Mauritania", lat: 20.0, lon: -10.0 },
  NG: { name: "Niger", lat: 16.0, lon: 8.0 },
  NI: { name: "Nigeria", lat: 9.0, lon: 8.0 },
  SG: { name: "Senegal", lat: 14.5, lon: -14.5 },
  SL: { name: "Sierra Leone", lat: 8.5, lon: -11.5 },
  TO: { name: "Togo", lat: 8.0, lon: 1.17 },

  // Central Africa
  AO: { name: "Angola", lat: -12.5, lon: 18.5 },
  CM: { name: "Cameroon", lat: 6.0, lon: 12.0 },
  CT: { name: "Central African Republic", lat: 6.5, lon: 20.5 },
  CD: { name: "Chad", lat: 15.0, lon: 19.0 },
  CF: { name: "Congo", lat: -1.0, lon: 15.0 },
  CG: { name: "DR Congo", lat: -4.0, lon: 23.0 },
  GB: { name: "Gabon", lat: -1.0, lon: 11.75 },
  GV: { name: "Equatorial Guinea", lat: 1.5, lon: 10.0 },
  ST: { name: "São Tomé and Príncipe", lat: 0.3, lon: 6.7 },

  // East Africa
  BY: { name: "Burundi", lat: -3.5, lon: 30.0 },
  CN: { name: "Comoros", lat: -12.0, lon: 44.0 },
  DJ: { name: "Djibouti", lat: 11.5, lon: 43.0 },
  ER: { name: "Eritrea", lat: 15.0, lon: 39.0 },
  ET: { name: "Ethiopia", lat: 9.0, lon: 40.0 },
  KE: { name: "Kenya", lat: 1.0, lon: 38.0 },
  RW: { name: "Rwanda", lat: -2.0, lon: 30.0 },
  SE: { name: "Seychelles", lat: -4.5, lon: 55.5 },
  SO: { name: "Somalia", lat: 5.0, lon: 46.0 },
  TZ: { name: "Tanzania", lat: -6.0, lon: 35.0 },
  UG: { name: "Uganda", lat: 1.0, lon: 32.0 },

  // Southern Africa
  BC: { name: "Botswana", lat: -22.0, lon: 24.0 },
  LT: { name: "Lesotho", lat: -29.5, lon: 28.5 },
  MA: { name: "Madagascar", lat: -19.0, lon: 46.0 },
  MI: { name: "Malawi", lat: -13.5, lon: 34.0 },
  MP: { name: "Mauritius", lat: -20.2, lon: 57.5 },
  MZ: { name: "Mozambique", lat: -18.0, lon: 35.0 },
  WA: { name: "Namibia", lat: -22.0, lon: 17.0 },
  SF: { name: "South Africa", lat: -29.0, lon: 24.0 },
  WZ: { name: "Eswatini", lat: -26.5, lon: 31.5 },
  ZM: { name: "Zambia", lat: -15.0, lon: 30.0 },
  ZW: { name: "Zimbabwe", lat: -19.0, lon: 29.0 },
}

// Update map center when data changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function AfricaEventMap({
  countryData,
  selectedCountry,
  onCountryClick,
}: AfricaEventMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Color based on Goldstein score
  const getColor = (goldstein: number): string => {
    if (goldstein < -5) return "#dc2626"
    if (goldstein < -2) return "#ef4444"
    if (goldstein < 0) return "#f87171"
    if (goldstein < 2) return "#fbbf24"
    if (goldstein < 5) return "#4ade80"
    return "#22c55e"
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0d1117] text-[#a5a5a5]">
        Loading map...
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[0, 20]}
        zoom={4}
        minZoom={3}
        maxZoom={8}
        style={{ height: "100%", width: "100%", background: "#0d1117" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        <MapController center={[0, 20]} />

        {/* Render circle markers for each country with data */}
        {Object.entries(countryData).map(([code, data]) => {
          const coords = countryCoordinates[code]
          if (!coords) return null

          const isSelected = selectedCountry === code
          const color = isSelected ? "#4a9eff" : getColor(data.avgGoldstein)
          const radius = Math.sqrt(data.count) * 2 + 6

          return (
            <CircleMarker
              key={code}
              center={[coords.lat, coords.lon]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: isSelected ? 0.9 : 0.7,
                color: isSelected ? "#4a9eff" : "#ffffff",
                weight: isSelected ? 3 : 1,
                opacity: 1,
              }}
              eventHandlers={{
                click: () => onCountryClick(code),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-bold">{coords.name}</div>
                  <div>Events: {data.count}</div>
                  <div>Avg Goldstein: {data.avgGoldstein.toFixed(2)}</div>
                  <div className="text-xs mt-1 text-gray-600">Click to filter</div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}
