# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application built with React 19 that visualizes and tracks Russia-Africa relations through an interactive dashboard. The application parses CSV data from an external source and provides filtering, searching, sorting, and visualization capabilities.

## Commands

### Development
- `pnpm dev` - Start development server
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Notes
- ESLint and TypeScript errors are ignored during builds (configured in [next.config.mjs](next.config.mjs:3-7))
- The project uses pnpm as the package manager

## Architecture

### Data Flow
1. CSV data is fetched from Vercel blob storage on component mount ([app/page.tsx](app/page.tsx:296-298))
2. Data is parsed using PapaParse library ([app/page.tsx](app/page.tsx:301-305))
3. Filtered data flows through multiple useMemo hooks for cross-filtering ([app/page.tsx](app/page.tsx:351-427))
4. Three main visualization components consume the filtered data: type metrics, timeline strip plot, and location table

### Key State Management Pattern
The dashboard implements **cross-filtering** where selecting one dimension (type, country, week) filters all visualizations simultaneously:
- `selectedType`, `selectedCountry`, `selectedWeek` are the filter states ([app/page.tsx](app/page.tsx:235-237))
- `filteredData` applies cross-filters first ([app/page.tsx](app/page.tsx:351-375))
- `filteredAndSearchedData` applies search query and sorting to already filtered data ([app/page.tsx](app/page.tsx:377-427))
- All metrics and visualizations derive from `filteredData` to stay in sync

### Component Structure
- **Single-page application**: All dashboard logic is in [app/page.tsx](app/page.tsx) (~900 lines)
- **Minimal component extraction**: Map components ([components/leaflet-map.tsx](components/leaflet-map.tsx), [components/map-view.tsx](components/map-view.tsx)) and theme provider ([components/theme-provider.tsx](components/theme-provider.tsx)) exist but aren't currently used in the main page
- **shadcn/ui components**: Located in [components/ui/](components/ui/) but largely unused in current implementation
- **Inline SVG visualization**: Timeline strip plot is rendered directly in JSX ([app/page.tsx](app/page.tsx:761-869))

### Styling
- **Tailwind CSS 4**: Primary styling system
- **Dark theme**: Hard-coded color palette (`#2a2d32` background, `#4a9eff` accents)
- **Roboto Condensed font**: Loaded via Google Fonts in [app/layout.tsx](app/layout.tsx:7-11)
- **Global styles**: Located at [app/globals.css](app/globals.css)

### Data Model
The `EventData` interface ([app/page.tsx](app/page.tsx:8-31)) defines the CSV structure with fields like:
- `Type`: Event category (ECON, SEC, DIP, INFO)
- `event_locations`: Pipe-separated country codes
- `first_event_date`, `Date`: Temporal information
- `title`, `description`: Event details
- Various metadata fields for actors, keywords, and sources

### Path Aliases
Configured in [tsconfig.json](tsconfig.json:21-23) and [components.json](components.json:13-18):
- `@/*` maps to root directory
- Allows imports like `@/lib/utils`, `@/components/ui/button`

### External Dependencies
- **Leaflet**: Maps library loaded via CDN in [app/layout.tsx](app/layout.tsx:27-40) (not currently used)
- **PapaParse**: CSV parsing
- **Radix UI**: Component primitives (installed but mostly unused)
- **date-fns**, **recharts**: Available but not actively used in current implementation

## Development Notes

### When Adding Features
- Consider extracting logic from [app/page.tsx](app/page.tsx) if adding complexity - the file is already large
- Maintain the cross-filtering pattern when adding new filter dimensions
- New visualizations should consume `filteredData` to respect active filters

### Data Processing
- Country codes use FIPS standard, mapped to full names in `countryCodeMap` ([app/page.tsx](app/page.tsx:33-220))
- Multiple countries per event are pipe-separated in `event_locations` field
- Events with empty/N/A titles are filtered out ([app/page.tsx](app/page.tsx:354))

### CSV Export
The export function ([app/page.tsx](app/page.tsx:337-348)) exports `filteredAndSearchedData`, meaning exports respect all active filters and search queries.
