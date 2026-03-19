# Scoreanalyzr

A modern web application for music analysis, visualization, and education built with Next.js and TypeScript.

## Overview

Notalyzr is a powerful music analysis tool that combines modern web technologies with advanced music theory concepts. It provides a comprehensive platform for musicians, educators, and enthusiasts to analyze, visualize, and interact with musical content.

### Key Features

- Real-time music notation rendering
- Interactive music theory learning tools
- AI-powered music analysis and recommendations
- MIDI file processing and visualization
- Audio playback and analysis capabilities
- Customizable music theory visualizations
- Cloud-based collaboration features

### Target Audience

- Music students and educators
- Music theorists and analysts
- Composers and songwriters
- Music technology enthusiasts
- Music educators

## Features

- Music notation visualization using OpenSheetMusicDisplay
- Interactive music theory components
- AI-powered music analysis
- Real-time audio playback using Web Audio API
- Music theory data visualization with Recharts
- Modern UI components using Mantine and Radix UI
- Cloudflare deployment support
- Firebase integration for backend services
- TypeScript for type safety and development efficiency

## Project Structure

```
.
├── src/                 # Source code
├── components.json      # Component configuration
├── docs/               # Documentation
├── music_theory.json   # Music theory data
├── next.config.ts      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS configuration
└── wrangler.jsonc      # Cloudflare configuration
```

## Tech Stack

### Frontend
- **Framework**: Next.js 15.2.3
- **Language**: TypeScript
- **UI Components**: Mantine, Radix UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand, Valtio
- **Form Handling**: React Hook Form
- **Music Processing**: Tone.js, WebAudioFont
- **Data Visualization**: Recharts
- **AI Integration**: OpenAI, Genkit

### Backend
- **Database**: Firebase
- **Deployment**: Cloudflare Pages
- **Authentication**: Firebase Auth
- **Cloud Functions**: Firebase Functions

## Getting Started

### Prerequisites
- Node.js (latest LTS version)
- npm or yarn
- Firebase CLI (for backend development)
- Cloudflare CLI (for deployment)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with required environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other required env variables
```

### Development

1. Start the development server:
```bash
npm run dev
```

2. The application will be available at `http://localhost:9002`

3. For AI development:
```bash
npm run genkit:dev
```

4. For AI development with watch mode:
```bash
npm run genkit:watch
```

### Build and Deploy

Build the application:
```bash
npm run build
```

Preview the build:
```bash
npm run preview
```

Deploy to Cloudflare:
```bash
npm run deploy
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please:

1. Check the documentation in the `docs` directory
2. Open an issue on the GitHub repository
3. Contact the maintainers directly

## Acknowledgments

- OpenSheetMusicDisplay for music notation rendering
- Tone.js for audio processing
- Firebase for backend services
- Cloudflare for deployment infrastructure
- All contributors and users who have helped shape this project
