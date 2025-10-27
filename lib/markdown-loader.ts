import { marked } from "marked"

const infoContent: Record<string, string> = {}

export async function loadWidgetInfo(widgetId: string): Promise<string> {
  // Return cached content if available
  if (infoContent[widgetId]) {
    return infoContent[widgetId]
  }

  try {
    const response = await fetch(`/content/widget-info/${widgetId}.md`)
    if (!response.ok) {
      throw new Error(`Failed to load ${widgetId}.md`)
    }
    const markdown = await response.text()
    const html = await marked.parse(markdown)
    infoContent[widgetId] = html
    return html
  } catch (error) {
    console.error(`Error loading widget info for ${widgetId}:`, error)
    return "<p>Information not available.</p>"
  }
}
