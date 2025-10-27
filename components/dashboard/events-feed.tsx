"use client"

import type { ProcessedEventData } from "@/lib/types/events"
import { getCountryName, getTypeConfig, loadConfig } from "@/lib/config-loader"

interface EventsFeedProps {
  data: ProcessedEventData[]
  highlightedRowIndex: number | null
}

export function EventsFeed({ data, highlightedRowIndex }: EventsFeedProps) {
  const config = loadConfig()

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      <div className="w-full max-w-full">
        <div className="mb-3 text-xs text-[#666]">{data.length} stories</div>
        {data.map((event, i) => {
          const typeConfig = getTypeConfig(event.Type, config)
          const eventDate = event.Date ? new Date(event.Date) : null
          const formattedDate = eventDate
            ? eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "N/A"

          // Extract country names from event_locations_array
          const countries = event.event_locations_array
            .map((code) => ({ code, name: getCountryName(code, config) }))
            .filter((item) => item.name !== item.code) // Filter out unmapped codes
            .map((item) => item.name)
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
                  {typeConfig?.label?.replace(/\s*\(.*?\)\s*/g, "") || event.Type}
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
  )
}
