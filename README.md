# Competitive Feedback Analyzer

> Transform app store reviews into competitive intelligence

## Why

Product teams spend hours manually sifting through competitor reviews to understand what users really think. We wanted to automate this tedious process and surface actionable insights in minutes, not days.

This tool scrapes Google Play and App Store reviews, uses AI to identify themes and sentiment patterns, then generates head-to-head competitive analysis with specific recommendations.

## What It Does

- **Scrapes Real Reviews**: Pulls latest reviews from Google Play Store and Apple App Store
- **AI-Powered Analysis**: Uses Google Gemini to cluster feedback into meaningful themes
- **Competitive Insights**: Compares your app vs competitors across user sentiment and ratings
- **Actionable Recommendations**: Generates specific product improvement suggestions

## How It Works

1. **Enter App IDs**: Your app + one competitor (Google Play or App Store)
2. **AI Processing**: Fetches ~200 reviews per app, clusters themes, analyzes sentiment
3. **Smart Comparison**: Identifies where you're winning, losing, and opportunities to improve
4. **Export Insights**: Get prioritized recommendations for your product roadmap

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **AI**: Google Gemini Flash API for review clustering and insights
- **Data**: google-play-scraper, App Store RSS feeds

## Quick Start

```bash
# Install dependencies
npm install

# Add your Gemini API key (optional - works without it)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and try these examples:
- **Google Play**: WhatsApp (`com.whatsapp`) vs Instagram (`com.instagram.android`)
- **App Store**: Netflix (`363590051`) vs Prime Video (`545519333`)

## Features

- **Multi-Page Scraping**: Fetches up to 100 reviews per app for comprehensive analysis
- **Real-Time Processing**: Live data from app stores, not cached or stale information  
- **Smart Error Handling**: Clear messages when apps aren't found or have no reviews
- **Theme Clustering**: AI groups similar feedback into actionable categories
- **Rating Analysis**: Compares sentiment and ratings across shared themes
- **Export Ready**: Results formatted for product team consumption

```bash
npm run build
```

Or deploy to any Node.js hosting platform. The app is stateless and scales horizontally.

## API Usage

The tool respects rate limits:
- **Gemini API**: Max 10 calls per analysis (well under free tier limits)
- **App Stores**: Polite scraping with delays between requests
- **Caching**: Avoids duplicate API calls for same app combinations
