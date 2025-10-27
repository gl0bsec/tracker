export interface EventData {
  SOURCEURL: string
  Date: string
  "Event name": string
  Type: string
  cluster: string
  actor1_countries: string
  actor2_countries: string
  event_locations: string
  combined_text_entities: string
  combined_text_entity_types: string
  keywords: string
  first_event_date: string
  title: string
  description: string
  event_count: string
  avg_goldstein_score: string
  site_name: string
  language: string
  actor1_names: string
  actor2_names: string
  event_descriptions: string
  author: string
}

export interface ProcessedEventData extends EventData {
  event_locations_array: string[]
  parsed_date: Date
  parsed_first_event_date: Date
  parsed_goldstein: number
}

export type SortColumn = "date" | "type" | "title" | "description" | "source"
export type SortDirection = "asc" | "desc"
export type TimelineLayout = "table" | "feed"
export type ViewMode = "overview" | "insights"
