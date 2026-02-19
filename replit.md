# Paris Stories

## Overview
Paris Stories is an Expo React Native app with an Express backend that generates AI-powered podcast stories about Paris. Users can browse curated topics or create custom podcasts with AI-generated scripts and audio.

## Architecture
- **Frontend**: Expo React Native (mobile app served via Expo Go / landing page for web)
- **Backend**: Express.js server on port 5000
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Anthropic Claude (via Replit AI Integrations) for script generation
- **TTS**: Google Cloud Text-to-Speech for audio generation

## Project Structure
```
app/              - Expo React Native screens (tabs, player, login, etc.)
server/           - Express backend
  index.ts        - Server entry point (port 5000)
  routes.ts       - API routes for podcast generation, history, custom podcasts
  auth.ts         - Firebase Authentication (Admin SDK token verification, user sync)
  storage.ts      - Database client and user queries
  tts.ts          - TTS interface (Google Cloud Text-to-Speech)
  google-tts.ts   - Google Cloud Text-to-Speech client (Chirp 3 HD / Neural2 / Wavenet voices)
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
- `users` - User accounts with Firebase Authentication (firebaseUid, email)
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
- 2026-02-19: Migrated audio storage to Replit Object Storage for persistence across deployments. Audio files uploaded to Object Storage bucket, with local filesystem as fast cache. New /api/podcast/audio-stream/:filename endpoint serves from local cache first, falls back to Object Storage. Player has graceful error handling with retry for unreachable audio.
- 2026-02-17: Production cleanup — removed bcryptjs (unused), legacy password-based auth functions, Python module, stale build artifacts. Updated .gitignore for podcast-audio/, server_dist/, static-build/, attached_assets/.
- 2026-02-17: Script prompt improvements — no abbreviations (het i.p.v. 't), no dashes or ellipses, phonetically clear text for TTS.
- 2026-02-17: Removed ElevenLabs TTS entirely — Google Cloud TTS is now the sole provider. Removed provider selection step from podcast creation flows. Cleaned up elevenlabs-tts.ts, TTS_PROVIDER env var, and all related UI/backend code.
- 2026-02-16: Upgraded Google TTS voices — Chirp 3: HD for NL/EN, Neural2 for FR/ES/DE/IT/PT/JA (full SSML), Wavenet kept for ZH. Voice type auto-detected per language, prompt instructions adapt accordingly.
- 2026-02-16: Rewrote podcast generation prompts — factual "local guide" role, no filler words, plain text for Chirp 3, SSML for Wavenet/Neural2.
- 2026-02-16: Async podcast generation with job polling (prevents timeout on long podcasts), 404 fast-fail on lost jobs
- 2026-02-15: Replaced custom email/password auth with Firebase Authentication (Firebase Admin SDK on backend, Firebase Auth SDK on frontend)
- 2026-02-14: Added Metro dev server proxy - Express now proxies Expo Go requests to Metro bundler for live development
- 2026-02-14: Added runtimeVersion (exposdk:54.0.0) to app.json for Expo Go SDK 54 compatibility
- 2026-02-14: Switched TTS from OpenAI to Google Cloud Text-to-Speech API (Wavenet voices, multi-language support)
- 2026-02-14: Initial Replit setup - configured database, workflows, and deployment
