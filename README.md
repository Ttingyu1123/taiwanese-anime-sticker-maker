<div align="center">
<!-- Suggest replacing with actual project screenshot later -->
<h1>Taiwanese Anime Sticker Maker 🇹🇼✨</h1>
<p>Create unique anime-style stickers with a Taiwanese twist! Powered by Google Gemini.</p>
</div>

## Features
- **AI-Powered Generation**: Uses Google Gemini to generate anime stickers.
- **Taiwanese Cultural Elements**: tuned for Taiwanese aesthetics and themes.
- **Instant Preview & Download**: Generate, view, and save your stickers as zip.

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- A Google Gemini API Key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file in the root directory (or rename `.env.example` if available).
2. Add your Gemini API Key:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   *(Note: The project uses `GEMINI_API_KEY` in `vite.config.ts`, make sure variable names match your env setup)*

### Running Locally

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Building for Production

```bash
npm run build
```

## Deployment

This project is configured for **GitHub Pages**.
Just push to the `main` or `master` branch, and the included GitHub Action will:
1. Build the project.
2. Deploy the `dist` folder to GitHub Pages.

Ensure "GitHub Pages" is enabled in your repository settings (Settings > Pages > Source: "GitHub Actions").

## Tech Stack
- React 19
- Vite
- TypeScript
- Google Gemini API
- Lucide React
