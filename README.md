# AppTweak Analytics Dashboard

A modern, dark-themed web application for AppTweak analytics with a clean, minimal design inspired by Vercel's aesthetic.

## Features

- **API Key Management**: Secure storage of AppTweak API keys with localStorage persistence
- **App Metrics Tool**: Fetch current metrics for up to 5 apps simultaneously
- **Modern UI**: Dark theme with shadcn/ui components, Inter font, and small border radius
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Real-time Data**: Direct integration with AppTweak's public API

## Available Metrics

- Downloads
- Revenue
- Ratings
- Daily Ratings
- App Power

## Supported Platforms

- iPhone
- iPad
- Android

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- AppTweak API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd apptweak-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Configure API Key**: Enter your AppTweak API key in the API Configuration section. It will be saved locally for future use.

2. **Add App IDs**: Enter up to 5 app IDs you want to analyze.

3. **Select Metrics**: Choose which metrics you want to fetch (downloads, revenue, ratings, etc.).

4. **Choose Country & Device**: Select the target country and device platform.

5. **Fetch Data**: Click "Fetch App Metrics" to retrieve the data from AppTweak's API.

## API Integration

The application integrates with AppTweak's public API endpoints:

- **App Metrics**: `https://public-api.apptweak.com/api/public/store/apps/metrics/current.json`
- **Countries**: `https://public-api.apptweak.com/api/public/apptweak/countries`
- **Languages**: `https://public-api.apptweak.com/api/public/apptweak/languages`

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Font**: Inter

## Project Structure

```
├── app/
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main application page
├── components/
│   └── ui/                  # shadcn/ui components
├── data/
│   ├── countries.json       # Country codes and flags
│   └── languages.json       # Language codes
├── lib/
│   └── utils.ts            # Utility functions
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 