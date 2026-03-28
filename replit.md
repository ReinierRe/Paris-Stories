# Paris Stories (Multi-Tenant)

## Overview
Paris Stories is an Expo React Native app with an Express backend that generates AI-powered podcast stories. The backend is **multi-tenant**: a single server serves multiple city apps (separate App Store listings, shared infrastructure). Each city frontend sends an `X-City-Id` header; the server loads city config from the database.

## Architecture
- **Frontend**: Expo React Native (mobile app served via Expo Go / landing page for web)
- **Backend**: Express.js server on port 5000 (multi-tenant, serves all cities)
- **Database**: PostgreSQL with Drizzle ORM (all tables scoped by `cityId`)
- **AI**: Anthropic Claude claude-sonnet-4-5 (via Replit AI Integrations) for script generation
- **TTS**: Google Cloud Text-to-Speech for audio generation
- **Multi-Tenant**: Frontend sends `X-City-Id` header; server resolves city config from DB with 5-min cache

## Project Structure
```
app/              - Expo React Native screens (tabs, player, login, etc.)
server/           - Express backend
  index.ts        - Server entry point (port 5000), wires city middleware
  routes.ts       - API routes for podcast generation, history, custom podcasts (city-aware)
  auth.ts         - Firebase Authentication (Admin SDK token verification, user sync with cityId)
  storage.ts      - Database client and user queries (cityId-scoped)
  city-middleware.ts - X-City-Id header resolution, DB city config loading, 5-min cache
  city-prompts.ts - City-specific AI prompt helpers (accept City param from DB)
  tts.ts          - TTS interface (Google Cloud Text-to-Speech)
  google-tts.ts   - Google Cloud Text-to-Speech client (Chirp 3 HD / Neural2 / Wavenet voices)
  audio-cleanup.ts - Audio file deletion (local + Object Storage)
shared/           - Shared types and database schema
  schema.ts       - Drizzle ORM table definitions (cities, users, cachedPodcasts, customPodcasts, userPodcasts)
lib/              - Frontend utilities
  query-client.ts - API client that sends X-City-Id header on all requests
components/       - React Native components
contexts/         - React contexts (Auth, Podcast)
constants/        - Theme and color constants
  city.ts         - Frontend city identity config (name, localizations, user levels)
  onboarding.ts   - Login/onboarding slide content (derived from city.ts)
  themes.ts       - Curated themes, topics, angles, podcast lengths, user levels
assets/           - Images and icons
podcast-audio/    - Generated audio files (local cache)
patches/          - npm patch files
scripts/          - Database migration scripts
  multi-tenant-migration.sql - Reproducible multi-tenant schema + Paris seed
app.config.ts     - Dynamic Expo config (reads EXPO_PUBLIC_CITY_ID for per-city builds)
CITY_SETUP.md     - Multi-tenant city setup guide
```

## Key Scripts
- `npm run server:dev` - Start development server with tsx
- `npm run server:build` - Build server with esbuild
- `npm run server:prod` - Run production server
- `npm run db:push` - Push database schema changes
- `npm run expo:dev` - Start Expo dev server (for native development)

## Database Tables
- `cities` - City configuration (name, country, app name, localized names, AI prompt config, privacy policy)
- `users` - User accounts with Firebase Authentication (firebaseUid, email, cityId) — unique on `(email, cityId)`
- `cached_podcasts` - Pre-generated podcast cache — unique on `(cityId, topicId, angle, voice, language, length)`
- `custom_podcasts` - User-created custom podcasts (scoped by cityId)
- `user_podcasts` - Links users to cached podcasts — unique on `(cityId, userId, cachedPodcastId)`

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

## App Store Submission
See `APP_STORE_METADATA.md` for complete App Store Connect metadata including:
- App description, subtitle, keywords, promotional text
- Age rating questionnaire answers (result: 4+)
- Privacy labels configuration (Email, User Content, User ID, Usage Data)
- App Review Notes with detailed testing instructions
- Demo account setup instructions
- Screenshot requirements and checklist
- Build & submission checklist

## EAS Build (iOS App Store)
- `eas.json` configured with development, preview, and production profiles
- Production build: `eas build --platform ios --profile production`
- Submit to App Store: `eas submit --platform ios --profile production`
- Requires EAS CLI: `npm install -g eas-cli` and `eas login`
- Apple Developer Team ID, App Store Connect App ID, and Apple ID must be filled in `eas.json` submit section

## Recent Changes
- 2026-03-28: Multi-tenant refactor — single server now serves multiple city apps. Added `cities` table with all city config (AI prompts, localized names, user levels). Added `cityId` column to all tables (users, cached_podcasts, custom_podcasts, user_podcasts) with updated unique indexes and FK constraints. Created `server/city-middleware.ts` (X-City-Id header resolution, DB city config loading with 5-min cache). Refactored `server/city-prompts.ts` to accept City param from DB instead of global constants. All DB queries in routes.ts, storage.ts, auth.ts now scoped by cityId. Frontend sends X-City-Id header via `lib/query-client.ts` (reads from app.json extra.cityId). Audio stream endpoint accepts `?city=` query param for native audio players. Privacy policy endpoint uses `?city=` query param. Account deletion only removes Firebase user when no other city accounts remain. Dynamic `app.config.ts` reads `EXPO_PUBLIC_CITY_ID` for per-city EAS builds. Reproducible migration script at `scripts/multi-tenant-migration.sql`. Paris seeded as default city. See `CITY_SETUP.md` for adding new cities.
- 2026-03-28: White-label prep — centralized all city-specific content for easy duplication. Created `constants/city.ts` (frontend city config), `server/city-prompts.ts` (backend AI prompt config), `constants/onboarding.ts` (login slides). Updated i18n files to use `%{city}` interpolation (auto-injected by `useTranslation` hook). User levels in `themes.ts` now derived from `city.ts`. AI prompts (role descriptions, moderation, user prompts, walking-tour/modern-culture perspectives) and privacy policy HTML all read from `city-prompts.ts`. See `CITY_SETUP.md` for full duplication guide.
- 2026-03-12: App Store launch prep — EAS build configuration (eas.json), deployment configured (autoscale), metadata updated with Spanish language, AI model references removed from descriptions, privacy policy email updated to vragen@greenhome.nl.
- 2026-02-27: Fixed SSML tags showing in French/German/Spanish transcripts — added markdown code fence stripping, improved SSML detection based on voice type instead of content parsing.
- 2026-02-27: Fixed custom podcast error handling — moderation rejections now show friendly in-app alerts instead of console errors, fixed split bundle error from dynamic imports.
- 2026-02-27: Added Spanish (ES) as 5th language — full system prompts, perspective translations, Chirp3/SSML instructions, frontend language lists, backend validation.
- 2026-02-24: Fixed AI model references — updated content moderation and title generation to use supported model, simplified AI disclosure text in app.
- 2026-02-21: Gamification — user levels (Traveler/Explorer/Connoisseur/Parisien) based on ready podcast count, level badge + progress bar on Profile, level-up celebration alert after podcast creation. Profile stats changed from Total/Ready to Standard/Custom.
- 2026-02-21: Curated content updates — History expanded to 8 topics (added Catacombs, Knights Templar, Plague Years, Joan of Arc), Museums replaced Walking Tour + Monet's Paris with Fondation LV + Musée Carnavalet, French Revolution "Iconic Figures" angle renamed to "Personal Stories".
- 2026-02-20: App Store compliance — added AI content moderation for custom podcast topics (rejects inappropriate content via Anthropic), AI transparency disclosures in both podcast flows and privacy policy, documented App Review submission notes.
- 2026-02-20: Moved language & voice preferences from podcast creation flow to user profile. Added NL/EN/FR/DE language options and male/female voice selection in Profile screen. Preferences stored in users table (preferredLanguage, preferredVoice) with PATCH /api/auth/preferences endpoint. Podcast creation flows (curated + custom) now use profile settings, shown in confirm overview.
- 2026-02-20: App Store readiness improvements — added Delete Account (Apple requirement) with full data cleanup (DB + Object Storage + Firebase), Privacy Policy page (/privacy-policy) linked from Profile and Login, Forgot Password via Firebase, rate limiting on podcast generation (10/hour per user), interactive seekable progress bar in player.
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
