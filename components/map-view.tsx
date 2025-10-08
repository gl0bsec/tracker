"use client"

interface MapViewProps {
  countryData: Record<string, number>
  selectedCountry: string | null
  onCountryClick: (code: string) => void
}

const countryCoords: Record<string, { name: string; lat: number; lon: number }> = {
  GH: { name: "Ghana", lat: 7.9465, lon: -1.0232 },
  KE: { name: "Kenya", lat: -0.0236, lon: 37.9062 },
  UG: { name: "Uganda", lat: 1.3733, lon: 32.2903 },
  ZA: { name: "South Africa", lat: -30.5595, lon: 22.9375 },
  NG: { name: "Nigeria", lat: 9.082, lon: 8.6753 },
  EG: { name: "Egypt", lat: 26.8206, lon: 30.8025 },
  ET: { name: "Ethiopia", lat: 9.145, lon: 40.4897 },
  TZ: { name: "Tanzania", lat: -6.369, lon: 34.8888 },
  CD: { name: "DR Congo", lat: -4.0383, lon: 21.7587 },
  MA: { name: "Morocco", lat: 31.7917, lon: -7.0926 },
  AO: { name: "Angola", lat: -11.2027, lon: 17.8739 },
  MZ: { name: "Mozambique", lat: -18.6657, lon: 35.5296 },
  MG: { name: "Madagascar", lat: -18.7669, lon: 46.8691 },
  CM: { name: "Cameroon", lat: 7.3697, lon: 12.3547 },
  CI: { name: "Côte d'Ivoire", lat: 7.54, lon: -5.5471 },
  NE: { name: "Niger", lat: 17.6078, lon: 8.0817 },
  BF: { name: "Burkina Faso", lat: 12.2383, lon: -1.5616 },
  ML: { name: "Mali", lat: 17.5707, lon: -3.9962 },
  MW: { name: "Malawi", lat: -13.2543, lon: 34.3015 },
  ZM: { name: "Zambia", lat: -13.1339, lon: 27.8493 },
  ZW: { name: "Zimbabwe", lat: -19.0154, lon: 29.1549 },
  RW: { name: "Rwanda", lat: -1.9403, lon: 29.8739 },
  SO: { name: "Somalia", lat: 5.1521, lon: 46.1996 },
  SN: { name: "Senegal", lat: 14.4974, lon: -14.4524 },
  TD: { name: "Chad", lat: 15.4542, lon: 18.7322 },
  SD: { name: "Sudan", lat: 12.8628, lon: 30.2176 },
  SS: { name: "South Sudan", lat: 6.877, lon: 31.307 },
  CF: { name: "Central African Republic", lat: 6.6111, lon: 20.9394 },
  LY: { name: "Libya", lat: 26.3351, lon: 17.2283 },
  TN: { name: "Tunisia", lat: 33.8869, lon: 9.5375 },
  DZ: { name: "Algeria", lat: 28.0339, lon: 1.6596 },
  BJ: { name: "Benin", lat: 9.3077, lon: 2.3158 },
  TG: { name: "Togo", lat: 8.6195, lon: 0.8248 },
}

export default function MapView({ countryData, selectedCountry, onCountryClick }: MapViewProps) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 600 600" className="bg-[#0d1117]">
      {/* Background */}
      <rect x="0" y="0" width="600" height="600" fill="#0d1117" />

      {/* Grid lines for reference */}
      {[...Array(7)].map((_, i) => (
        <line
          key={`h-${i}`}
          x1="0"
          x2="600"
          y1={i * 100}
          y2={i * 100}
          stroke="#21262d"
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}
      {[...Array(7)].map((_, i) => (
        <line
          key={`v-${i}`}
          x1={i * 100}
          x2={i * 100}
          y1="0"
          y2="600"
          stroke="#21262d"
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}

      {/* Country markers */}
      {Object.entries(countryData).map(([code, count]) => {
        const coords = countryCoords[code]
        if (!coords) return null

        // Convert lat/lon to SVG coordinates
        // Africa roughly spans: lon -20 to 55, lat -35 to 38
        const x = ((coords.lon + 20) / 75) * 600
        const y = ((38 - coords.lat) / 73) * 600

        const radius = Math.sqrt(count) * 2.5 + 6
        const isSelected = selectedCountry === code
        const isDimmed = selectedCountry && !isSelected

        return (
          <g key={code}>
            <circle
              cx={x}
              cy={y}
              r={radius}
              fill={isSelected ? "#58a6ff" : "#ff6b6b"}
              opacity={isDimmed ? 0.2 : 0.7}
              stroke={isSelected ? "#58a6ff" : "transparent"}
              strokeWidth="2"
              className="cursor-pointer transition-all hover:opacity-100"
              onClick={() => onCountryClick(code)}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isSelected ? "#58a6ff" : "#c9d1d9"}
              fontSize="10"
              fontWeight="600"
              className="pointer-events-none select-none"
              opacity={isDimmed ? 0.3 : 1}
            >
              {count}
            </text>
            {/* Country name on hover */}
            <title>
              {coords.name}: {count} event{count !== 1 ? "s" : ""}
            </title>
          </g>
        )
      })}
    </svg>
  )
}
