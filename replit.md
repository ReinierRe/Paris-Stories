# Paris Stories

## Overview
Paris Stories is an Expo React Native app with an Express backend that generates AI-powered podcast stories about Paris. Users can browse curated topics or create custom podcasts with AI-generated scripts and audio.

## Architecture
- **Frontend**: Expo React Native (mobile app served via Expo Go / landing page for web)
- **Backend**: Express.js server on port 5000
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Anthropic Claude for script generation, OpenAI (via Replit AI Integrations) for text-to-speech audio generation

## Project Structure
```
app/              - Expo React Native screens (tabs, player, login, etc.)
server/           - Express backend
  index.ts        - Server entry point (port 5000)
  routes.ts       - API routes for podcast generation, history, custom podcasts
  auth.ts         - Token-based authentication (register, login, logout)
  storage.ts      - Database client and user queries
  replit_integrations/ - AI integration modules (audio, chat, image, batch)
shared/           - Shared types and database schema
  schema.ts       - Drizzle ORM table definitions (users, cachedPodcasts, customPodcasts, userPodcasts)
  models/         - Additional schema models
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
- `users` - User accounts with email/password auth
- `cached_podcasts` - Pre-generated podcast cache (by topic/angle/voice/language/length)
- `custom_podcasts` - User-created custom podcasts
- `user_podcasts` - Links users to cached podcasts they've listened to

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `AI_INTEGRATIONS_OPENAI_API_KEY` / `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI via Replit AI Integrations (for TTS)
- `AI_INTEGRATIONS_ANTHROPIC_API_KEY` / `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` - Anthropic via Replit AI Integrations (for script generation)

## Deployment
- Target: Autoscale
- Build: `npm run server:build` (esbuild bundles server to server_dist/)
- Run: `NODE_ENV=production node server_dist/index.js`

## Recent Changes
- 2026-02-14: Initial Replit setup - configured database, workflows, and deployment
