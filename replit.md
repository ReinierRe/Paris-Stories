# Paris Stories

## Overview
Paris Stories is an Expo React Native app with an Express backend that generates AI-powered podcast stories about Paris. Users can browse curated topics or create custom podcasts with AI-generated scripts and audio.

## Architecture
- **Frontend**: Expo React Native (mobile app served via Expo Go / landing page for web)
- **Backend**: Express.js server on port 5000
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Anthropic Claude (via Replit AI Integrations) for script generation
- **TTS**: ElevenLabs (default, via Replit connector) and Google Cloud Text-to-Speech (fallback) for audio generation

## Project Structure
```
app/              - Expo React Native screens (tabs, player, login, etc.)
server/           - Express backend
  index.ts        - Server entry point (port 5000)
  routes.ts       - API routes for podcast generation, history, custom podcasts
  auth.ts         - Firebase Authentication (Admin SDK token verification, user sync)
  storage.ts      - Database client and user queries
  tts.ts          - Unified TTS interface (ElevenLabs default, Google fallback)
  elevenlabs-tts.ts - ElevenLabs TTS client (multilingual v2, PCM→WAV)
  google-tts.ts   - Google Cloud Text-to-Speech client (Wavenet voices, WAV generation)
shared/           - Shared types and database schema
  schema.ts       - Drizzle ORM table definitions (users, cachedPodcasts, customPodcasts, userPodcasts)
components/       - React Native components
contexts/         - React contexts (Auth, Podcast)
constants/        - Theme and color constants
assets/           - Images and icons
podcast-audio/    - Generated audio files
patches/          - npm patch files
```

## Key Scripts
- `npm run server:dev` - Start development server with tsx
- `npm run server:build` - Build server with esbuild
- `npm run server:prod` - Run production server
- `npm run db:push` - Push database schema changes
- `npm run expo:dev` - Start Expo dev server (for native development)

## Database Tables
- `users` - User accounts with Firebase Authentication (firebaseUid, email, optional password for legacy)
- `cached_podcasts` - Pre-generated podcast cache (by topic/angle/voice/language/length)
- `custom_podcasts` - User-created custom podcasts
- `user_podcasts` - Links users to cached podcasts they've listened to

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_TTS_API_KEY` - Google Cloud API key (Text-to-Speech API must be enabled)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic via Replit AI Integrations (for script generation)
- `FIREBASE_API_KEY` / `FIREBASE_PROJECT_ID` / `FIREBASE_APP_ID` - Firebase web app config (forwarded as EXPO_PUBLIC_* to frontend)
- `FIREBASE_SERVICE_ACCOUNT_JSON` - Firebase Admin SDK service account JSON (for backend token verification)

## Deployment
- Target: Autoscale
- Build: `npm run server:build` (esbuild bundles server to server_dist/)
- Run: `NODE_ENV=production node server_dist/index.js`

## Development Architecture
- In dev mode, Express on port 5000 proxies Expo Go requests to Metro bundler on port 8081
- Metro is started as a child process by the Express server
- API routes (/api/*) handled directly by Express
- Landing page served by Express for browser requests (no expo-platform header)
- In production, static-build/ files are served instead of Metro proxy

## Recent Changes
- 2026-02-16: Rewrote podcast generation prompts — charismatic "local guide" role, TTS audio optimization (punctuation pacing, conversational elements, sensory anchors, self-correction), auto-tone selection (Mysterieus/Energiek/Nostalgisch/Elegant). SSML output for Google Wavenet (break, prosody, emphasis tags) with per-chunk wrapping and plain-text fallback on SSML errors.
- 2026-02-16: Added ElevenLabs TTS as default provider (via Replit connector), Google TTS as automatic fallback. Unified TTS interface in server/tts.ts. Set TTS_PROVIDER env var to "google" to switch back.
- 2026-02-16: Async podcast generation with job polling (prevents timeout on long podcasts), 404 fast-fail on lost jobs
- 2026-02-15: Replaced custom email/password auth with Firebase Authentication (Firebase Admin SDK on backend, Firebase Auth SDK on frontend)
- 2026-02-14: Added Metro dev server proxy - Express now proxies Expo Go requests to Metro bundler for live development
- 2026-02-14: Added runtimeVersion (exposdk:54.0.0) to app.json for Expo Go SDK 54 compatibility
- 2026-02-14: Switched TTS from OpenAI to Google Cloud Text-to-Speech API (Wavenet voices, multi-language support)
- 2026-02-14: Initial Replit setup - configured database, workflows, and deployment
