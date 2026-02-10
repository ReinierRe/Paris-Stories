# Paris Stories

## Overview

Paris Stories is a mobile-first podcast generator app built with Expo (React Native) and an Express backend. Users browse historical and cultural themes about Paris, customize podcast parameters (perspective, voice, language, length), and the app generates AI-narrated audio podcasts using Anthropic (Claude) for script generation and OpenAI for text-to-speech. Generated podcasts are stored locally on the device and can be played back in an audio player. Users can also create custom podcasts by entering their own Paris-related subjects with fixed angle categories (Historical, Modern Culture, Personal Stories).

## User Preferences

Preferred communication style: Simple, everyday language.

## Authentication

- **Provider**: Google Sign-In via `expo-auth-session` (app store ready)
- **Flow**: OAuth 2.0 implicit flow using `expo-auth-session/providers/google`
- **Client ID**: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID` env vars (from Firebase/Google Cloud Console)
- **Backend**: `server/auth.ts` — verifies Google access tokens via Google's userinfo API, issues session tokens
- **Frontend**: `contexts/AuthContext.tsx` manages auth state with token stored in AsyncStorage
- **Login Screen**: `app/login.tsx` — Parisian-themed dark gradient login screen with Google branding
- **Auth Gate**: `app/_layout.tsx` uses `AuthGate` component to show login screen when unauthenticated
- **Token Management**: Server-side in-memory token store with 7-day expiry, auto-cleanup every hour
- **Protected Routes**: `requireAuth` middleware protects `/api/podcast/generate`
- **Endpoints**: `POST /api/auth/google` (exchange token), `GET /api/auth/me` (verify session), `POST /api/auth/logout`
- **No Firebase SDK**: Uses expo-auth-session directly to avoid Metro bundler ESM compatibility issues

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **Navigation**: Tab-based layout with two main tabs (Library and My Podcasts), plus modal screens for customization and audio playback
- **State Management**: React Context (`PodcastContext`) for podcast data, `AuthContext` for authentication, TanStack React Query for server data fetching
- **Local Storage**: AsyncStorage for persisting generated podcasts and auth tokens on-device
- **Fonts**: DM Sans via `@expo-google-fonts/dm-sans`
- **Audio Playback**: `expo-av` for playing generated podcast audio files
- **Styling**: Plain React Native StyleSheet with a custom color palette (golden accent theme in `constants/colors.ts`)
- **Platform Support**: iOS, Android, and Web. Uses platform-specific UI adaptations (e.g., BlurView on native, different modal presentations)

### Route Structure

- `app/(tabs)/index.tsx` — Library: browse themes and topics about Paris
- `app/(tabs)/podcasts.tsx` — My Podcasts: list of generated podcasts with playback/delete
- `app/customize.tsx` — Multi-step modal: choose perspective, voice, language, length before generating
- `app/custom-create.tsx` — Multi-step modal for custom podcasts: enter subject, choose angle (Historical/Modern Culture/Personal Stories), voice, language, length
- `app/player.tsx` — Audio player screen with play/pause, progress, and script view

### Backend (Express)

- **Runtime**: Node.js with TypeScript (tsx for dev, esbuild for production build)
- **Server file**: `server/index.ts` — Express app with CORS handling for Replit domains
- **Routes**: `server/routes.ts` — Main API endpoints including podcast generation
- **Podcast Generation Pipeline**:
  1. Client sends topic + customization params to server
  2. Anthropic Claude generates a podcast script based on perspective, language, and word count
  3. OpenAI TTS converts the script to audio
  4. Audio is saved to `podcast-audio/` directory on the server and served as static files

### AI Integrations

- **Script Generation**: Anthropic Claude SDK (`@anthropic-ai/sdk`) via Replit AI Integrations (custom base URL)
- **Text-to-Speech**: OpenAI API via Replit AI Integrations for TTS with voice selection (onyx for male, nova for female)
- **Image Generation**: OpenAI `gpt-image-1` (available but not actively used in main flow)
- **Voice Chat**: Full voice recording/streaming infrastructure exists in `server/replit_integrations/audio/` (available for extension)

### Database

- **ORM**: Drizzle ORM with PostgreSQL dialect (node-postgres driver)
- **Config**: `drizzle.config.ts` points to `DATABASE_URL` env var
- **Schema**: `shared/schema.ts` defines `users` and `cached_podcasts` tables
- **Podcast Caching**: `cached_podcasts` table stores generated scripts and audio filenames with a unique index on `(topicId, angle, voice, language, length)`. The generate endpoint checks this cache first — if a matching podcast exists and the audio file is present, it returns the cached result without regenerating. New podcasts are inserted into the cache after generation.
- **Custom Podcasts**: `custom_podcasts` table stores user-created podcasts with userId, subject, angle, voice, language, length, script, audioFilename, durationSeconds. Each custom podcast is private to its creator. Angles are fixed: Historical, Modern Culture, Personal Stories. Endpoints: `POST /api/podcast/generate-custom`, `GET /api/podcast/custom`, `DELETE /api/podcast/custom/:id`.
- **Chat Models**: `shared/models/chat.ts` defines `conversations` and `messages` tables (used by replit integration chat/audio features)
- **Current Storage**: `server/storage.ts` uses in-memory storage (`MemStorage`) for user data — the Drizzle/Postgres setup is available but the main podcast feature uses the database for caching
- **Push Schema**: Use `npm run db:push` to sync schema to database

### Content Structure

- **Themes**: Defined in `constants/themes.ts` — 7 categories in order: History, French Revolution, Museums, Epic Buildings, Modern History, Neighborhoods, Food & Drinks
- **Topics**: Nested under themes — specific subjects like "Storming of the Bastille", "The Louvre"
- **Angles**: Per-theme angles (perspectives) that change the AI prompt style. Some themes have angles, others don't:
  - French Revolution: Historical, Iconic Figures
  - Museums: Origin of the Museum, Prominent Art Pieces, Architecture & Building
  - Neighborhoods: Historical, Cultural, Modern Times, Walking Tour
  - History, Epic Buildings, Modern History, Food & Drinks: no angles (step skipped in customize flow)
- **Languages**: English and Dutch (nl)
- **Podcast Lengths**: Configurable via `podcastLengths` constant

### Build & Deploy

- **Dev**: Two processes — `npm run expo:dev` for Expo and `npm run server:dev` for Express backend
- **Production Build**: `npm run expo:static:build` creates static web export, `npm run server:build` bundles server with esbuild
- **Production Run**: `npm run server:prod` serves both API and static web files
- **Static Build Script**: `scripts/build.js` handles Expo web export with Replit domain configuration

## External Dependencies

- **Anthropic Claude API**: Script generation via Replit AI Integrations (`AI_INTEGRATIONS_ANTHROPIC_API_KEY`, `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`)
- **OpenAI API**: Text-to-speech and image generation via Replit AI Integrations (`AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`)
- **PostgreSQL**: Database via `DATABASE_URL` environment variable (provisioned by Replit)
- **ffmpeg**: Required on the server for audio format conversion (used in `server/replit_integrations/audio/client.ts`)
- **AsyncStorage**: Client-side persistence for podcast metadata (no external service)
- **Replit Environment**: Uses `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `REPLIT_INTERNAL_APP_DOMAIN` for CORS and URL configuration