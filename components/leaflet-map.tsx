"use client"

import { useEffect, useRef } from "react"

interface LeafletMapProps {
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

declare global {
  interface Window {
    L: any
  }
}

export default function LeafletMap({ countryData, selectedCountry, onCountryClick }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || typeof window === "undefined" || !window.L) return

    const L = window.L

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [0, 20],
      zoom: 3,
      minZoom: 2,
      maxZoom: 6,
      zoomControl: true,
    })

    mapInstanceRef.current = map

    // Add dark tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === "undefined" || !window.L) return

    const L = window.L

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Add new markers
    Object.entries(countryData).forEach(([code, count]) => {
      const coords = countryCoords[code]
      if (!coords) return

      const radius = Math.sqrt(count) * 3 + 8
      const isSelected = selectedCountry === code
      const isDimmed = selectedCountry && !isSelected

      const circle = L.circleMarker([coords.lat, coords.lon], {
        radius: radius,
        fillColor: isSelected ? "#58a6ff" : "#ff6b6b",
        color: isSelected ? "#58a6ff" : "transparent",
        weight: 2,
        opacity: isDimmed ? 0.2 : 0.8,
        fillOpacity: isDimmed ? 0.2 : 0.7,
      })

      circle.bindTooltip(`${coords.name}: ${count} event${count !== 1 ? "s" : ""}`, {
        permanent: false,
        direction: "top",
      })

      circle.on("click", () => {
        onCountryClick(code)
      })

      circle.addTo(mapInstanceRef.current)
      markersRef.current.push(circle)
    })
  }, [countryData, selectedCountry, onCountryClick])

  return <div ref={mapRef} className="w-full h-full" />
}
