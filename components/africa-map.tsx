"use client"

interface AfricaMapProps {
  countryData: Record<string, { count: number; avgGoldstein: number }>
  selectedCountry: string | null
  onCountryClick: (code: string) => void
}

// Simplified Africa country paths (using approximate boundaries)
// Coordinates are normalized to fit in a 800x800 viewBox
const countryPaths: Record<string, string> = {
  // North Africa
  EG: "M 580 120 L 650 120 L 660 140 L 650 180 L 630 200 L 600 200 L 580 180 Z", // Egypt
  LY: "M 480 120 L 580 120 L 580 180 L 560 220 L 520 240 L 480 240 L 460 200 Z", // Libya
  TN: "M 440 80 L 480 80 L 480 120 L 460 140 L 440 130 Z", // Tunisia
  AG: "M 360 120 L 440 80 L 480 80 L 480 240 L 420 280 L 380 260 L 360 220 Z", // Algeria
  MO: "M 300 140 L 360 120 L 360 220 L 340 240 L 300 220 Z", // Morocco

  // West Africa
  MR: "M 300 220 L 340 240 L 340 300 L 320 320 L 300 320 Z", // Mauritania
  ML: "M 340 240 L 420 280 L 420 340 L 380 360 L 340 360 L 340 300 Z", // Mali
  NG: "M 340 360 L 380 360 L 380 400 L 360 420 L 340 420 Z", // Niger
  CD: "M 480 240 L 560 220 L 580 240 L 580 300 L 560 340 L 520 360 L 480 360 L 460 340 Z", // Chad
  SN: "M 280 320 L 320 320 L 320 340 L 300 350 L 280 340 Z", // Senegal
  GA: "M 300 350 L 320 340 L 340 360 L 320 370 L 300 370 Z", // Gambia
  GW: "M 280 360 L 300 350 L 300 370 L 280 370 Z", // Guinea-Bissau
  GN: "M 280 360 L 320 370 L 320 400 L 300 410 L 280 400 Z", // Guinea
  SL: "M 280 400 L 300 410 L 300 430 L 280 430 Z", // Sierra Leone
  LR: "M 300 410 L 320 400 L 340 420 L 320 440 L 300 430 Z", // Liberia
  CI: "M 320 400 L 360 420 L 360 460 L 340 470 L 320 450 L 320 420 Z", // Côte d'Ivoire
  BF: "M 340 360 L 380 360 L 380 400 L 360 420 L 340 420 Z", // Burkina Faso
  GH: "M 360 420 L 380 400 L 400 400 L 400 460 L 380 470 L 360 460 Z", // Ghana
  TG: "M 400 400 L 420 400 L 420 460 L 400 460 Z", // Togo
  BJ: "M 420 400 L 440 400 L 440 460 L 420 460 Z", // Benin
  NI: "M 420 340 L 480 360 L 500 360 L 500 440 L 480 460 L 440 460 L 440 400 L 420 400 Z", // Nigeria
  CM: "M 500 360 L 540 360 L 550 400 L 540 460 L 520 480 L 500 480 L 500 440 Z", // Cameroon

  // Central Africa
  CF: "M 560 340 L 620 360 L 640 380 L 640 420 L 620 440 L 580 440 L 560 420 L 540 400 L 540 360 Z", // Central African Republic
  SS: "M 580 300 L 640 300 L 660 320 L 660 380 L 640 380 L 620 360 L 580 340 L 580 300 Z", // South Sudan
  SU: "M 580 200 L 630 200 L 650 220 L 660 240 L 660 300 L 640 300 L 620 280 L 580 260 L 580 240 Z", // Sudan
  ET: "M 660 240 L 720 260 L 740 300 L 720 340 L 680 360 L 660 340 L 660 280 Z", // Ethiopia
  ER: "M 660 220 L 700 220 L 720 240 L 720 260 L 700 260 L 680 240 Z", // Eritrea
  DJ: "M 720 260 L 740 260 L 740 280 L 720 280 Z", // Djibouti
  SO: "M 720 280 L 760 300 L 780 340 L 780 380 L 760 400 L 740 400 L 720 380 L 720 340 Z", // Somalia
  KE: "M 660 360 L 720 380 L 720 460 L 680 480 L 640 480 L 620 460 L 620 440 L 640 420 L 640 380 Z", // Kenya
  UG: "M 620 440 L 660 440 L 680 460 L 680 480 L 640 480 L 620 460 Z", // Uganda
  RW: "M 600 480 L 620 480 L 620 500 L 600 500 Z", // Rwanda
  BI: "M 600 500 L 620 500 L 620 520 L 600 520 Z", // Burundi
  CG: "M 520 480 L 560 480 L 580 500 L 580 540 L 560 560 L 520 540 Z", // Congo
  CD: "M 560 480 L 640 480 L 660 500 L 660 560 L 640 600 L 600 620 L 560 620 L 540 600 L 540 560 L 560 540 L 580 540 L 580 500 L 560 480 Z", // DR Congo
  GA: "M 480 480 L 520 480 L 520 540 L 500 560 L 480 540 Z", // Gabon
  GQ: "M 500 460 L 520 460 L 520 480 L 500 480 Z", // Equatorial Guinea
  ST: "M 480 500 L 490 500 L 490 510 L 480 510 Z", // São Tomé and Príncipe

  // East Africa
  TZ: "M 620 520 L 680 520 L 700 540 L 700 600 L 680 640 L 640 660 L 600 660 L 580 640 L 580 600 L 600 580 L 620 560 Z", // Tanzania
  MZ: "M 640 660 L 680 660 L 700 680 L 700 740 L 680 760 L 660 760 L 640 740 L 620 720 L 620 680 Z", // Mozambique
  MW: "M 620 620 L 660 620 L 660 680 L 640 700 L 620 680 Z", // Malawi
  ZM: "M 540 600 L 600 620 L 620 640 L 620 680 L 600 700 L 560 700 L 540 680 L 520 660 Z", // Zambia
  ZW: "M 560 700 L 620 700 L 640 720 L 640 740 L 620 760 L 580 760 L 560 740 Z", // Zimbabwe
  BW: "M 520 680 L 560 700 L 560 760 L 540 780 L 500 780 L 480 760 L 480 720 Z", // Botswana
  NA: "M 420 680 L 480 680 L 500 700 L 500 780 L 460 800 L 420 780 L 400 760 Z", // Namibia
  AO: "M 480 540 L 540 560 L 560 580 L 560 620 L 540 640 L 520 660 L 500 680 L 480 680 L 460 660 L 460 580 Z", // Angola
  ZA: "M 460 760 L 540 780 L 580 780 L 620 760 L 640 780 L 620 820 L 580 840 L 520 840 L 460 820 L 440 800 Z", // South Africa
  LS: "M 540 800 L 560 800 L 560 820 L 540 820 Z", // Lesotho
  MG: "M 700 680 L 720 680 L 740 700 L 740 760 L 720 800 L 700 800 L 680 780 L 680 720 Z", // Madagascar
}

export default function AfricaMap({ countryData, selectedCountry, onCountryClick }: AfricaMapProps) {
  // Color based on Goldstein score
  const getColor = (goldstein: number) => {
    if (goldstein < -5) return "#dc2626" // deep red
    if (goldstein < -2) return "#ef4444" // red
    if (goldstein < 0) return "#f87171" // light red
    if (goldstein < 2) return "#fbbf24" // amber/yellow
    if (goldstein < 5) return "#4ade80" // light green
    return "#22c55e" // green
  }

  return (
    <svg width="100%" height="100%" viewBox="0 0 800 900" className="bg-[#0d1117]" preserveAspectRatio="xMidYMid meet">
      {/* Background */}
      <rect x="0" y="0" width="800" height="900" fill="#0d1117" />

      {/* Ocean/water areas */}
      <rect x="0" y="0" width="800" height="900" fill="#0a0e14" />

      {/* All country shapes - base layer (no data countries) */}
      {Object.entries(countryPaths).map(([code, path]) => {
        const data = countryData[code]
        const hasData = !!data
        const isSelected = selectedCountry === code
        const isDimmed = selectedCountry && !isSelected && hasData

        if (!hasData) {
          // Countries with no data - dark gray
          return (
            <path
              key={`${code}-base`}
              d={path}
              fill="#1a1f26"
              stroke="#2d3748"
              strokeWidth="1"
              opacity="0.5"
            />
          )
        }

        return null
      })}

      {/* Countries with data - colored layer */}
      {Object.entries(countryData).map(([code, data]) => {
        const path = countryPaths[code]
        if (!path) return null

        const isSelected = selectedCountry === code
        const isDimmed = selectedCountry && !isSelected
        const fillColor = isSelected ? "#4a9eff" : getColor(data.avgGoldstein)

        return (
          <g key={code}>
            <path
              d={path}
              fill={fillColor}
              stroke={isSelected ? "#4a9eff" : "#2d3748"}
              strokeWidth={isSelected ? "2" : "1"}
              opacity={isDimmed ? 0.3 : 0.8}
              className="cursor-pointer transition-all hover:opacity-100 hover:stroke-[#4a9eff]"
              onClick={() => onCountryClick(code)}
            >
              <title>
                {code}: {data.count} event{data.count !== 1 ? "s" : ""}
                {"\n"}Avg Goldstein: {data.avgGoldstein.toFixed(2)}
              </title>
            </path>
          </g>
        )
      })}
    </svg>
  )
}
