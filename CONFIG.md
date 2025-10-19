# Dashboard Configuration Guide

The dashboard uses a comprehensive JSON configuration file ([config.json](config.json)) that allows you to customize theming, layout, data sources, and UI elements without modifying code.

## Quick Start

1. **Update Data Source**: Edit `.env.local`
   ```env
   NEXT_PUBLIC_CSV_URL=https://your-new-data-source.com/data.csv
   ```

2. **Change Theme Colors**: Edit `config.json` → `theme.colors`
   ```json
   "colors": {
     "background": "#ffffff",
     "foreground": "#000000"
   }
   ```

3. **Adjust Layout**: Edit `config.json` → `layout`
   ```json
   "gridSplit": {
     "left": "60%",
     "right": "40%"
   }
   ```

## Configuration Sections

### 1. Metadata
Basic information about the dashboard configuration.

```json
"metadata": {
  "name": "Russia in Africa Tracker",
  "version": "1.0.0",
  "description": "Event tracking dashboard configuration"
}
```

### 2. Theme Configuration

#### Colors
Define the color palette for the entire dashboard:

```json
"theme": {
  "colors": {
    "background": "#fafafa",      // Main background color
    "foreground": "#1a1a1a",      // Main text color
    "muted": "#666",              // Secondary text color
    "border": "#e0e0e0",          // Border color
    "borderDark": "#999",         // Darker borders (metrics)
    "hover": "#ffffff",           // Hover state background
    "highlight": "#ffffff"        // Highlighted rows
  }
}
```

#### Typography
Control fonts and text styles:

```json
"typography": {
  "title": {
    "fontFamily": "serif",
    "fontSize": "text-2xl",
    "fontWeight": "font-bold"
  },
  "sectionHeader": {
    "fontSize": "text-base",
    "fontWeight": "font-bold"
  }
}
```

#### Spacing
Adjust padding, margins, and gaps:

```json
"spacing": {
  "containerPadding": {
    "x": "px-8",
    "y": "py-6"
  },
  "widgetGap": "gap-6",
  "metricGap": "gap-4"
}
```

### 3. Layout Configuration

Control widget positioning and sizing:

```json
"layout": {
  "maxWidth": "max-w-[1600px]",
  "gridSplit": {
    "left": "55%",     // Event timeline width
    "right": "45%"     // Charts/location width
  },
  "widgets": {
    "eventTimeline": {
      "enabled": true,
      "title": "Event Timeline",
      "features": {
        "search": true,
        "export": true
      }
    }
  }
}
```

### 4. Data Configuration

#### Source
Configure where data comes from:

```json
"data": {
  "source": {
    "url": "${NEXT_PUBLIC_CSV_URL}",  // Uses env variable
    "type": "csv",
    "caching": {
      "enabled": true,
      "duration": 3600000  // 1 hour in milliseconds
    }
  }
}
```

#### Column Mapping
**Critical**: Map your CSV columns to dashboard fields:

```json
"columnMapping": {
  "date": "Date",                    // Your CSV date column
  "type": "Type",                    // Your CSV type column
  "title": "title",                  // Your CSV title column
  "description": "description",      // Your CSV description column
  "eventLocations": "event_locations", // Your CSV locations column
  "goldsteinScore": "avg_goldstein_score"
}
```

**To use a different dataset:**
1. Update column names in `columnMapping` to match your CSV headers
2. Ensure required fields (`date`, `type`) exist in your CSV
3. Update the CSV URL in `.env.local`

#### Event Types
Configure event categories and their colors:

```json
"types": {
  "ECON": {
    "label": "Economic",
    "color": "#f97316",
    "enabled": true
  },
  "SEC": {
    "label": "Security",
    "color": "#ef4444",
    "enabled": true
  }
}
```

**To add a new type:**
```json
"CUSTOM": {
  "label": "Custom Events",
  "color": "#10b981",
  "enabled": true
}
```

#### Processing Options
```json
"processing": {
  "locationDelimiter": "|",  // Character separating multiple countries
  "dateFormat": "ISO8601",   // Expected date format
  "trimWhitespace": true     // Clean up data automatically
}
```

### 5. Features Configuration

#### Map Settings
```json
"map": {
  "enabled": true,
  "defaultZoom": 3.5,
  "center": [2, 20],  // [latitude, longitude]
  "tileLayer": "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
}
```

Popular tile layers:
- Light: `light_all/{z}/{x}/{y}{r}.png`
- Dark: `dark_all/{z}/{x}/{y}{r}.png`
- No labels: `light_nolabels/{z}/{x}/{y}{r}.png`

#### Search Configuration
```json
"search": {
  "enabled": true,
  "searchFields": ["title", "description", "eventName"],
  "caseSensitive": false
}
```

#### Export Settings
```json
"export": {
  "enabled": true,
  "format": "csv",
  "filenamePrefix": "russia-africa-events"
}
```

### 6. UI Text Labels

Customize all user-facing text:

```json
"ui": {
  "title": "What's Russia doing in Africa?",
  "subtitle": "An overview of events and activities",
  "labels": {
    "filters": "Filters:",
    "clearAll": "Clear all",
    "export": "Export",
    "search": "Search..."
  }
}
```

### 7. Table Column Configuration

Define which columns appear and how they're formatted:

```json
"tableColumns": {
  "eventTimeline": [
    {
      "key": "date",
      "label": "Date",
      "width": 85,
      "sortable": true,
      "resizable": true,
      "format": "date"
    },
    {
      "key": "type",
      "label": "Type",
      "colorCoded": true  // Uses type colors
    }
  ]
}
```

### 8. Country Code Mapping

Map country codes to full names:

```json
"countryMapping": {
  "useExternal": false,  // Set to true to load from external file
  "externalFile": "./data/country-codes.json",
  "inline": {
    "US": "United States",
    "UK": "United Kingdom"
  }
}
```

## Common Customization Scenarios

### Scenario 1: New Dataset

```json
// 1. Update .env.local
NEXT_PUBLIC_CSV_URL=https://mydata.com/events.csv

// 2. Update config.json columnMapping
"columnMapping": {
  "date": "event_date",           // Your CSV has "event_date"
  "type": "category",             // Your CSV has "category"
  "title": "event_title",         // Your CSV has "event_title"
  "eventLocations": "countries"   // Your CSV has "countries"
}

// 3. Update types if different categories
"types": {
  "CAT1": { "label": "Category 1", "color": "#ff0000", "enabled": true },
  "CAT2": { "label": "Category 2", "color": "#00ff00", "enabled": true }
}
```

### Scenario 2: Rebrand Dashboard

```json
{
  "ui": {
    "title": "My Custom Tracker",
    "subtitle": "Tracking important events"
  },
  "theme": {
    "colors": {
      "background": "#ffffff",
      "foreground": "#000000",
      "border": "#cccccc"
    }
  }
}
```

### Scenario 3: Disable Features

```json
{
  "features": {
    "map": {
      "enabled": false  // Hides map functionality
    },
    "export": {
      "enabled": false  // Disables CSV export
    }
  },
  "layout": {
    "widgets": {
      "locationWidget": {
        "enabled": false  // Hides entire location widget
      }
    }
  }
}
```

## Environment Variables

The configuration supports environment variable substitution using `${VAR_NAME}` syntax:

```json
"data": {
  "source": {
    "url": "${NEXT_PUBLIC_CSV_URL}"
  }
}
```

Only `NEXT_PUBLIC_*` variables are accessible (client-side).

## Validation

The configuration is validated on load. Check the browser console for errors if the dashboard fails to load.

Common validation errors:
- Missing required column mappings (`date`, `type`)
- Invalid URL format
- Missing event types
- Invalid color values

## Configuration Files

| File | Purpose |
|------|---------|
| `config.json` | Main configuration file |
| `.env.local` | Environment variables (CSV URL, API keys) |
| `lib/config-types.ts` | TypeScript type definitions |
| `lib/config-loader.ts` | Configuration loading utility |

## Tips

1. **Test Changes Incrementally**: Make one change at a time and refresh
2. **Use Version Control**: Track config changes in git
3. **Backup Before Major Changes**: Copy `config.json` before big edits
4. **Check Browser Console**: Look for validation errors if dashboard breaks
5. **Restart Dev Server**: After changing `.env.local`, restart with `pnpm dev`

## Example Configurations

See `examples/` directory for:
- Minimal configuration
- Dark theme variant
- Different dataset structure
- Disabled features configuration
