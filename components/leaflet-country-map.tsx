"use client"

import { useEffect, useRef, useMemo, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface LeafletCountryMapProps {
  countryData: Record<string, { count: number; avgGoldstein: number }>
  selectedCountry: string | null
  onCountryClick: (code: string) => void
}

// Comprehensive mapping of FIPS codes to ISO 3166-1 alpha-3 codes for African countries
const fipsToIso3: Record<string, string> = {
  // North Africa
  AG: "DZA", // Algeria
  EG: "EGY", // Egypt
  LY: "LBY", // Libya
  MO: "MAR", // Morocco
  TS: "TUN", // Tunisia
  SU: "SDN", // Sudan
  OD: "SSD", // South Sudan
  EH: "ESH", // Western Sahara

  // West Africa
  BN: "BEN", // Benin
  UV: "BFA", // Burkina Faso
  CV: "CPV", // Cape Verde
  IV: "CIV", // Côte d'Ivoire
  GA: "GMB", // Gambia
  GB: "GAB", // Gabon (not West but was missing)
  GH: "GHA", // Ghana
  GN: "GIN", // Guinea
  GW: "GNB", // Guinea-Bissau
  LI: "LBR", // Liberia
  ML: "MLI", // Mali
  MR: "MRT", // Mauritania
  NG: "NER", // Niger
  NI: "NGA", // Nigeria
  SG: "SEN", // Senegal
  SL: "SLE", // Sierra Leone
  TO: "TGO", // Togo

  // Central Africa
  AO: "AGO", // Angola
  CM: "CMR", // Cameroon
  CT: "CAF", // Central African Republic
  CD: "TCD", // Chad
  CF: "COG", // Congo (Republic)
  CG: "COD", // Congo (Democratic Republic)
  GV: "GNQ", // Equatorial Guinea
  EK: "GNQ", // Equatorial Guinea (alternate)
  ST: "STP", // São Tomé and Príncipe

  // East Africa
  BY: "BDI", // Burundi
  CN: "COM", // Comoros
  DJ: "DJI", // Djibouti
  ER: "ERI", // Eritrea
  ET: "ETH", // Ethiopia
  KE: "KEN", // Kenya
  RW: "RWA", // Rwanda
  SE: "SYC", // Seychelles
  SO: "SOM", // Somalia
  TZ: "TZA", // Tanzania
  UG: "UGA", // Uganda

  // Southern Africa
  BC: "BWA", // Botswana
  LT: "LSO", // Lesotho
  MA: "MDG", // Madagascar
  MI: "MWI", // Malawi
  MP: "MUS", // Mauritius
  MZ: "MOZ", // Mozambique
  WA: "NAM", // Namibia
  SF: "ZAF", // South Africa
  WZ: "SWZ", // Swaziland/Eswatini
  ZM: "ZMB", // Zambia
  ZW: "ZWE", // Zimbabwe
}

export default function LeafletCountryMap({
  countryData,
  selectedCountry,
  onCountryClick,
}: LeafletCountryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null)

  // Memoize the reverse mapping
  const iso3ToFips = useMemo(() => {
    const mapping: Record<string, string> = {}
    Object.entries(fipsToIso3).forEach(([fips, iso3]) => {
      mapping[iso3] = fips
    })
    return mapping
  }, [])

  // Helper to extract ISO3 code from GeoJSON feature (tries multiple common properties)
  const getIso3FromFeature = useCallback((feature: any): string | null => {
    const props = feature?.properties
    if (!props) return null
    // Try common property names used in different GeoJSON sources
    return props.id || props.ISO_A3 || props.iso_a3 || props.ADM0_A3 || props.adm0_a3 || null
  }, [])

  // Color based on Goldstein score
  const getColor = useCallback((goldstein: number) => {
    if (goldstein < -5) return "#dc2626" // deep red
    if (goldstein < -2) return "#ef4444" // red
    if (goldstein < 0) return "#f87171" // light red
    if (goldstein < 2) return "#fbbf24" // amber/yellow
    if (goldstein < 5) return "#4ade80" // light green
    return "#22c55e" // green
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [0, 20], // Centered on Africa
      zoom: 4,
      minZoom: 3,
      maxZoom: 7,
      zoomControl: true,
    })

    mapInstanceRef.current = map

    // Add dark tile layer - using CartoDB Dark Matter
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map)

    // Load Africa GeoJSON data
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries/AFR.geo.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        return response.json()
      })
      .then((geojsonData) => {
        console.log("✅ GeoJSON loaded. Features:", geojsonData?.features?.length || 0)
        console.log("📊 Country data keys:", Object.keys(countryData).length, "countries")
        if (Object.keys(countryData).length > 0) {
          console.log("Sample data:", Object.keys(countryData).slice(0, 5))
        }

        const geoJsonLayer = L.geoJSON(geojsonData, {
          style: (feature) => {
            const iso3 = getIso3FromFeature(feature)
            const fipsCode = iso3 ? iso3ToFips[iso3] : null
            const data = fipsCode ? countryData[fipsCode] : null

            // Debug first few features
            if (geojsonData.features.indexOf(feature) < 3) {
              console.log(`Feature ${geojsonData.features.indexOf(feature)}:`, {
                name: feature?.properties?.name,
                iso3,
                fipsCode,
                hasData: !!data
              })
            }

            let fillColor = "#1a1f26" // Default dark gray for no data
            let fillOpacity = 0.5

            if (data) {
              fillColor = selectedCountry === fipsCode ? "#4a9eff" : getColor(data.avgGoldstein)
              fillOpacity = selectedCountry && selectedCountry !== fipsCode ? 0.3 : 0.7
            }

            return {
              fillColor,
              weight: 1,
              opacity: 1,
              color: selectedCountry === fipsCode ? "#4a9eff" : "#2d3748",
              fillOpacity,
            }
          },
          onEachFeature: (feature, layer) => {
            const iso3 = getIso3FromFeature(feature)
            const name = feature?.properties?.name
            const fipsCode = iso3 ? iso3ToFips[iso3] : null
            const data = fipsCode ? countryData[fipsCode] : null

            // Add tooltip
            if (data && name) {
              layer.bindTooltip(
                `<strong>${name}</strong><br/>Events: ${data.count}<br/>Avg Goldstein: ${data.avgGoldstein.toFixed(2)}`,
                {
                  sticky: true,
                  className: "custom-tooltip",
                }
              )
            } else if (name) {
              layer.bindTooltip(`<strong>${name}</strong><br/>No data`, {
                sticky: true,
                className: "custom-tooltip",
              })
            }

            // Add click handler
            if (fipsCode) {
              layer.on("click", () => {
                onCountryClick(fipsCode)
              })

              // Add hover effect
              layer.on("mouseover", function () {
                if (data) {
                  this.setStyle({
                    weight: 2,
                    color: "#4a9eff",
                  })
                }
              })

              layer.on("mouseout", function () {
                geoJsonLayer.resetStyle(this)
              })
            }
          },
        }).addTo(map)

        geoJsonLayerRef.current = geoJsonLayer
      })
      .catch((error) => {
        console.error("Error loading GeoJSON:", error)
      })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update styles when countryData or selectedCountry changes
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle((feature) => {
        const iso3 = getIso3FromFeature(feature)
        const fipsCode = iso3 ? iso3ToFips[iso3] : null
        const data = fipsCode ? countryData[fipsCode] : null

        let fillColor = "#1a1f26"
        let fillOpacity = 0.5

        if (data) {
          fillColor = selectedCountry === fipsCode ? "#4a9eff" : getColor(data.avgGoldstein)
          fillOpacity = selectedCountry && selectedCountry !== fipsCode ? 0.3 : 0.7
        }

        return {
          fillColor,
          weight: 1,
          opacity: 1,
          color: selectedCountry === fipsCode ? "#4a9eff" : "#2d3748",
          fillOpacity,
        }
      })
    }
  }, [countryData, selectedCountry, iso3ToFips, getIso3FromFeature, getColor])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-[#1a1f26] border border-[#4a9eff] rounded p-3 text-xs z-[1000]">
        <div className="font-semibold mb-2 text-white">Goldstein Score</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#dc2626" }}></div>
            <span className="text-[#a5a5a5]">&lt; -5 (High conflict)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#ef4444" }}></div>
            <span className="text-[#a5a5a5]">-5 to -2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#f87171" }}></div>
            <span className="text-[#a5a5a5]">-2 to 0</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#fbbf24" }}></div>
            <span className="text-[#a5a5a5]">0 to 2 (Neutral)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#4ade80" }}></div>
            <span className="text-[#a5a5a5]">2 to 5</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4" style={{ background: "#22c55e" }}></div>
            <span className="text-[#a5a5a5]">&gt; 5 (Cooperation)</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#4a4a4a]">
            <div className="w-4 h-4" style={{ background: "#1a1f26", opacity: 0.5 }}></div>
            <span className="text-[#a5a5a5]">No data</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-tooltip {
          background: #1a1f26 !important;
          border: 1px solid #4a9eff !important;
          color: #ffffff !important;
          border-radius: 4px !important;
          padding: 8px !important;
          font-size: 12px !important;
        }
        .leaflet-container {
          background: #0d1117 !important;
        }
      `}</style>
    </div>
  )
}
