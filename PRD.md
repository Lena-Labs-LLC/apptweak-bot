# Product Requirements Document

## Tasks

- [x] Create AppTweak webapp with modern dark theme UI
  - Basic opening page with API key input (persistent storage)
  - App Metrics tool with app ID inputs (up to 5), metric checkboxes, country/device dropdowns
  - Minimal design with Vercel-like black-white theme, shadcn components, Inter font
  - Fetch and store country/language codes from AppTweak API

- [x] Add Historic App Data functionality
  - Date picker components for selecting date ranges
  - API routes for historical metrics from AppTweak
  - Toggle between current and historical data modes
  - Enhanced visualization for time-series data with proper formatting
  - Credit cost information and error handling for insufficient credits

- [x] Add App Metadata feature
  - Fetch comprehensive app metadata including titles, descriptions, screenshots, icons, and more
  - Support for up to 10 app IDs per request
  - Country, device, and language selection for localized metadata
  - Preview metadata in beautiful card layout with app icons and key information
  - Download metadata as structured JSON files with export information
  - Pricing: 10 credits per app for all metadata elements

- [x] Add Selective Metadata Export
  - Checkboxes for specific metadata elements (icon, screenshots, title, subtitle, description)
  - Organized folder structure: each element type gets its own folder
  - Download as ZIP archive with proper file organization
  - App-specific folders with clean naming (e.g., "App_Name/title/title.txt")
  - Support for both iOS and Android screenshot formats
  - Automatic image downloading and proper file extensions
  - Metadata summary JSON for each app
  - ✅ **FULLY WORKING**: Screenshots download correctly from existing metadata
  - Uses cached metadata to avoid API credit consumption
  - Handles complex screenshot object structures with URL extraction

- [x] Push the app to GitHub repository
  - Initialize git repository and set up proper .gitignore
  - Remove node_modules and large files to avoid GitHub size limits
  - Successfully push to https://github.com/Lena-Labs-LLC/apptweak-bot.git

- [x] Fix Vercel deployment error
  - Remove deprecated `experimental.appDir` option from next.config.js
  - Fix TypeScript errors in selective-download route
  - Ensure build passes locally and on Vercel
