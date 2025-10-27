"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ProcessedEventData, SortColumn, SortDirection } from "@/lib/types/events"

interface EventsTableProps {
  data: ProcessedEventData[]
  sortColumn: SortColumn | null
  sortDirection: SortDirection
  onSort: (column: string) => void
  highlightedRowIndex: number | null
}

export function EventsTable({ data, sortColumn, sortDirection, onSort, highlightedRowIndex }: EventsTableProps) {
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

  const handleResizeStart = (e: React.MouseEvent, column: string) => {
    e.preventDefault()
    setResizing(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column as keyof typeof columnWidths])
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return

      const diff = e.clientX - startX
      const newWidth = Math.max(50, startWidth + diff)

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

  return (
    <div className="flex-1 overflow-y-auto overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead className="bg-[#fafafa] sticky top-0 border-b-2 border-[#1a1a1a]">
          <tr>
            <th
              className="text-left px-2.5 py-2 text-[#1a1a1a] text-[10px] font-bold uppercase tracking-wide relative cursor-pointer hover:text-[#666] transition-colors select-none"
              style={{ width: columnWidths.date }}
              onClick={() => onSort("date")}
            >
              <div className="flex items-center gap-1">
                Date
                {sortColumn === "date" && <span className="text-[#1a1a1a]">{sortDirection === "asc" ? "↑" : "↓"}</span>}
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
              onClick={() => onSort("type")}
            >
              <div className="flex items-center gap-1">
                Type
                {sortColumn === "type" && <span className="text-[#1a1a1a]">{sortDirection === "asc" ? "↑" : "↓"}</span>}
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
              onClick={() => onSort("title")}
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
              onClick={() => onSort("description")}
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
              onClick={() => onSort("source")}
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
          {data.map((event, i) => (
            <tr
              key={i}
              id={`event-row-${i}`}
              className={`border-b border-[#e0e0e0] transition-colors ${
                highlightedRowIndex === i ? "bg-white" : "hover:bg-white"
              }`}
            >
              <td className="px-2.5 py-2 text-[#666] whitespace-nowrap text-xs" style={{ width: columnWidths.date }}>
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
                    color:
                      event.Type === "ECON"
                        ? "#f97316"
                        : event.Type === "SEC"
                          ? "#ef4444"
                          : event.Type === "DIP"
                            ? "#d4a017"
                            : event.Type === "INFO"
                              ? "#4a9eff"
                              : "#1a1a1a",
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
        {data.length} events
      </div>
    </div>
  )
}
