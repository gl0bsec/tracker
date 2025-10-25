"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface TimelineDataPoint {
  type: string
  date: Date
  title: string
  description: string
  eventData: any
}

interface D3TimelineProps {
  data: TimelineDataPoint[]
  startDate: Date
  endDate: Date
  onPointClick: (eventData: any) => void
  onZoom?: (start: Date, end: Date) => void
  zoomRange: { start: Date; end: Date } | null
}

const typeColors: Record<string, string> = {
  ECON: "#f97316",
  SEC: "#ef4444",
  DIP: "#d4a017",
  INFO: "#4a9eff",
}

export default function D3Timeline({
  data,
  startDate,
  endDate,
  onPointClick,
  onZoom,
  zoomRange,
}: D3TimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const container = containerRef.current
    const svg = d3.select(svgRef.current)

    const renderChart = () => {
      // Clear previous content
      svg.selectAll("*").remove()

    // Get container dimensions
    const containerRect = container.getBoundingClientRect()
    const margin = { top: 15, right: 15, bottom: 20, left: 65 }
    const width = containerRect.width - margin.left - margin.right
    const height = containerRect.height - margin.top - margin.bottom

    // Create main group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    // Scales
    const types = ["ECON", "SEC", "DIP", "INFO"]
    const yScale = d3
      .scaleBand()
      .domain(types)
      .range([0, height])
      .padding(0.25)

    const currentStart = zoomRange?.start || startDate
    const currentEnd = zoomRange?.end || endDate

    const xScale = d3
      .scaleTime()
      .domain([currentStart, currentEnd])
      .range([0, width])

    // Calculate tick count based on width for responsive detail
    const tickCount = Math.max(3, Math.min(8, Math.floor(width / 100)))

    // Grid lines
    const gridGroup = g.append("g").attr("class", "grid")

    // Vertical grid lines
    const xAxis = d3.axisBottom(xScale).ticks(tickCount)
    gridGroup
      .selectAll("line.vertical")
      .data(xScale.ticks(tickCount))
      .enter()
      .append("line")
      .attr("class", "vertical")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.5)

    // Horizontal lines for each type
    types.forEach((type, i) => {
      const y = (yScale(type) || 0) + (yScale.bandwidth() / 2)

      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y)
        .attr("y2", y)
        .attr("stroke", "#e0e0e0")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.5)

      g.append("text")
        .attr("x", -8)
        .attr("y", y)
        .attr("text-anchor", "end")
        .attr("dominant-baseline", "middle")
        .attr("fill", "#1a1a1a")
        .attr("font-size", "11px")
        .attr("font-weight", "700")
        .text(type)
    })

    // X-axis labels
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const xAxisGroup = g.append("g").attr("transform", `translate(0,${height + 10})`)

    // Adaptive label formatting based on tick count
    xScale.ticks(tickCount).forEach((d) => {
      let labelText = ""
      if (tickCount <= 4) {
        // Sparse: show month and date
        labelText = `${monthNames[d.getMonth()]} ${d.getDate()}`
      } else if (tickCount <= 6) {
        // Medium: show abbreviated month, date only if not 1st
        labelText = `${monthNames[d.getMonth()]} ${d.getDate() !== 1 ? d.getDate() : ''}`
      } else {
        // Dense: show only month abbreviation or date
        labelText = d.getDate() === 1 ? monthNames[d.getMonth()] : d.getDate().toString()
      }

      xAxisGroup
        .append("text")
        .attr("x", xScale(d))
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("fill", "#666")
        .attr("font-size", "11px")
        .text(labelText.trim())
    })

    // Data points
    const pointsGroup = g.append("g").attr("class", "points")

    data.forEach((d, i) => {
      const typeIndex = types.indexOf(d.type)
      if (typeIndex === -1) return
      if (d.date < currentStart || d.date > currentEnd) return

      const baseY = (yScale(d.type) || 0) + (yScale.bandwidth() / 2)

      // Hash-based jitter for consistent positioning
      const seed = d.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + d.date.getTime()
      const jitter = ((seed % 1000) / 1000 - 0.5) * (yScale.bandwidth() * 0.5)
      const y = baseY + jitter

      const x = xScale(d.date)

      const circle = pointsGroup
        .append("circle")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 3)
        .attr("fill", typeColors[d.type] || "#999")
        .attr("opacity", 0.7)
        .style("cursor", "pointer")
        .on("mouseover", function() {
          d3.select(this).attr("opacity", 1)
        })
        .on("mouseout", function() {
          d3.select(this).attr("opacity", 0.7)
        })
        .on("click", function(event) {
          event.stopPropagation()
          onPointClick(d.eventData)
        })

      // Tooltip
      circle.append("title").text(`${d.title}\n${d.date.toLocaleDateString()}\n\n${d.description}`)
    })

    // Brush for zoom selection
    if (onZoom) {
      const brush = d3
        .brushX()
        .extent([[0, 0], [width, height]])
        .on("end", (event) => {
          if (!event.selection) return

          const [x0, x1] = event.selection as [number, number]
          const newStart = xScale.invert(x0)
          const newEnd = xScale.invert(x1)

          // Only zoom if selection is meaningful
          if (x1 - x0 > 10) {
            onZoom(newStart, newEnd)
          }

          // Clear brush
          brushGroup.call(brush.move, null)
        })

      const brushGroup = g.append("g").attr("class", "brush")
      brushGroup.call(brush)
    }
    }

    // Initial render
    renderChart()

    // Add resize observer to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      renderChart()
    })

    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [data, startDate, endDate, zoomRange, onPointClick, onZoom])

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ display: "block" }}
      />
    </div>
  )
}
