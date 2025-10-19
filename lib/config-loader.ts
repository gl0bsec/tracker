/**
 * Configuration loader utility
 * Loads and validates dashboard configuration
 */

import type { DashboardConfig } from "./config-types"
import dashboardConfig from "../config.json"

/**
 * Load dashboard configuration
 * Performs environment variable substitution for values like ${NEXT_PUBLIC_CSV_URL}
 */
export function loadConfig(): DashboardConfig {
  const config = dashboardConfig as DashboardConfig

  // Substitute environment variables in data source URL
  if (config.data.source.url.includes("${")) {
    config.data.source.url = substituteEnvVars(config.data.source.url)
  }

  return config
}

/**
 * Substitute environment variables in strings
 * Format: ${VAR_NAME}
 */
function substituteEnvVars(str: string): string {
  return str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    // Check if it's a NEXT_PUBLIC variable (client-side accessible)
    if (varName.startsWith("NEXT_PUBLIC_")) {
      return process.env[varName] || match
    }
    return match
  })
}

/**
 * Get country name from code using config
 */
export function getCountryName(code: string, config: DashboardConfig): string {
  return config.countryMapping.inline[code] || code
}

/**
 * Get enabled event types from config
 */
export function getEnabledTypes(config: DashboardConfig): string[] {
  return Object.entries(config.data.types)
    .filter(([_, typeConfig]) => typeConfig.enabled)
    .map(([key, _]) => key)
}

/**
 * Get type configuration by key
 */
export function getTypeConfig(
  type: string,
  config: DashboardConfig
): { label: string; color: string } | null {
  const typeConfig = config.data.types[type]
  if (!typeConfig || !typeConfig.enabled) return null

  return {
    label: typeConfig.label,
    color: typeConfig.color,
  }
}

/**
 * Get column value using config mapping
 * Maps the configured column name to the actual data field
 */
export function getColumnValue(row: any, mappingKey: keyof DashboardConfig["data"]["columnMapping"], config: DashboardConfig): any {
  const actualColumnName = config.data.columnMapping[mappingKey]
  return row[actualColumnName]
}

/**
 * Validate configuration
 * Checks for required fields and valid values
 */
export function validateConfig(config: DashboardConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required metadata
  if (!config.metadata.name) errors.push("Missing metadata.name")
  if (!config.metadata.version) errors.push("Missing metadata.version")

  // Check data source
  if (!config.data.source.url) errors.push("Missing data.source.url")

  // Check required column mappings
  const requiredMappings = ["date", "type", "title", "description"]
  requiredMappings.forEach((key) => {
    if (!config.data.columnMapping[key as keyof typeof config.data.columnMapping]) {
      errors.push(`Missing column mapping: ${key}`)
    }
  })

  // Check types configuration
  if (!config.data.types || Object.keys(config.data.types).length === 0) {
    errors.push("No event types configured")
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
