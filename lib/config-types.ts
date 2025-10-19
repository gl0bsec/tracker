/**
 * TypeScript types for dashboard configuration
 */

export interface DashboardConfig {
  metadata: {
    name: string
    version: string
    description: string
  }
  theme: ThemeConfig
  layout: LayoutConfig
  data: DataConfig
  features: FeaturesConfig
  ui: UIConfig
  tableColumns: TableColumnsConfig
  countryMapping: CountryMappingConfig
}

export interface ThemeConfig {
  colors: {
    background: string
    foreground: string
    muted: string
    border: string
    borderDark: string
    hover: string
    highlight: string
  }
  typography: {
    title: TypographyStyle
    sectionHeader: TypographyStyle
    tableHeader: TypographyStyle
    body: TypographyStyle
  }
  spacing: {
    containerPadding: {
      x: string
      y: string
    }
    widgetGap: string
    metricGap: string
    sectionMargin: string
  }
}

export interface TypographyStyle {
  fontFamily?: string
  fontSize: string
  fontWeight: string
  transform?: string
}

export interface LayoutConfig {
  maxWidth: string
  gridSplit: {
    left: string
    right: string
  }
  widgets: {
    eventTimeline: WidgetConfig
    timelineChart: TimelineChartConfig
    locationWidget: WidgetConfig
    typeMetrics: MetricsWidgetConfig
  }
}

export interface WidgetConfig {
  enabled: boolean
  title: string
  position: string
  features?: Record<string, boolean>
}

export interface TimelineChartConfig extends WidgetConfig {
  height: number
  dateRange: {
    start: string
    end: string
  }
  monthLabels: string[]
}

export interface MetricsWidgetConfig {
  enabled: boolean
  position: string
  layout: string
}

export interface DataConfig {
  source: {
    url: string
    type: string
    caching: {
      enabled: boolean
      duration: number
    }
  }
  columnMapping: ColumnMapping
  validation: {
    requiredFields: string[]
    filterEmptyTitles: boolean
    excludeValues: Record<string, string[]>
  }
  types: Record<string, TypeConfig>
  processing: {
    locationDelimiter: string
    dateFormat: string
    trimWhitespace: boolean
  }
}

export interface ColumnMapping {
  id: string
  date: string
  firstEventDate: string
  type: string
  title: string
  description: string
  eventName: string
  sourceUrl: string
  eventLocations: string
  goldsteinScore: string
  eventCount: string
  actor1Countries: string
  actor2Countries: string
  actor1Names: string
  actor2Names: string
  keywords: string
  entities: string
  entityTypes: string
  eventDescriptions: string
  siteName: string
  language: string
  author: string
}

export interface TypeConfig {
  label: string
  color: string
  enabled: boolean
}

export interface FeaturesConfig {
  crossFiltering: {
    enabled: boolean
    filters: string[]
  }
  search: {
    enabled: boolean
    searchFields: string[]
    caseSensitive: boolean
  }
  export: {
    enabled: boolean
    format: string
    filenamePrefix: string
  }
  map: {
    enabled: boolean
    defaultZoom: number
    center: [number, number]
    minZoom: number
    maxZoom: number
    tileLayer: string
    attribution: string
  }
  visualization: {
    timeline: {
      pointSize: number
      pointOpacity: number
      jitterAmount: number
      gridOpacity: number
    }
  }
}

export interface UIConfig {
  title: string
  subtitle: string
  loading: {
    message: string
    mapMessage: string
  }
  emptyStates: {
    noData: string
    noResults: string
  }
  labels: Record<string, string>
}

export interface TableColumnsConfig {
  eventTimeline: ColumnConfig[]
  locationTable: ColumnConfig[]
}

export interface ColumnConfig {
  key: string
  label: string
  width?: number
  align?: "left" | "center" | "right"
  sortable?: boolean
  resizable?: boolean
  format?: "date" | "link" | "text"
  colorCoded?: boolean
  fontWeight?: string
  fontSize?: string
}

export interface CountryMappingConfig {
  useExternal: boolean
  externalFile?: string
  inline: Record<string, string>
}
