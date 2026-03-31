# Paris Stories (Multi-Tenant)

## Overview
Paris Stories is an Expo React Native mobile application with an Express.js backend designed to generate AI-powered podcast stories. The project aims to provide a multi-tenant platform where a single backend infrastructure can serve multiple city-specific applications, each with its own App Store listing. The core capability involves generating engaging, localized audio stories using advanced AI and text-to-speech technologies. The long-term vision is to expand to numerous cities, offering personalized historical and cultural narratives to users worldwide.

## User Preferences
I prefer detailed explanations and iterative development. Ask before making major changes.

## System Architecture
The application follows a multi-tenant architecture where a single Express.js backend serves multiple city-specific React Native frontends.

**Frontend (Expo React Native):**
- Developed with Expo React Native for cross-platform mobile compatibility.
- Uses dynamic Expo config (`app.config.ts`) to support per-city builds based on `EXPO_PUBLIC_CITY_ID`.
- Features a global audio player with `AudioPlayerContext` and `MiniPlayer` component for continuous playback.
- UI/UX includes curated themes, topics, angles, and podcast lengths.
- Supports multiple languages (NL, EN, FR, DE, ES) and voice selections.
- User gamification with levels (e.g., Traveler, Explorer) based on podcast consumption.

**Backend (Express.js):**
- Multi-tenant Express.js server running on port 5000.
- Resolves city configuration from the database using an `X-City-Id` header sent by the frontend, with a 5-minute cache.
- API routes handle podcast generation, history management, and custom podcast creation, all scoped by `cityId`.
- Implements Firebase Authentication for user management, with `firebaseUid`, `email`, and `cityId` for user identification.
- Employs AI content moderation for custom podcast topics to ensure appropriateness.
- Provides rate limiting for podcast generation (10 per hour per user).
- Handles audio streaming from local cache or Object Storage.

**Database (PostgreSQL with Drizzle ORM):**
- PostgreSQL database utilized with Drizzle ORM for schema definition and interaction.
- All tables are designed to be `cityId`-scoped, including `cities`, `users`, `cached_podcasts`, `custom_podcasts`, and `user_podcasts`.
- The `cities` table stores comprehensive city configuration, including AI prompt settings, localized names, and privacy policies.
- `cached_podcasts` stores pre-generated podcasts, uniquely identified by `(cityId, topicId, angle, voice, language, length)`.
- Topic-theme mapping, theme angles, and perspective prompts are stored in JSONB columns within the `cities` table, allowing for dynamic, city-specific content.

**AI and TTS Integration:**
- AI podcast script generation is powered by Anthropic Claude (`claude-sonnet-4-5`) via Replit AI Integrations.
- Text-to-Speech (TTS) is handled by Google Cloud Text-to-Speech, supporting Chirp 3 HD, Neural2, and Wavenet voices across multiple languages, with voice type auto-detection.

## External Dependencies
- **Anthropic Claude (via Replit AI Integrations):** For AI-powered podcast script generation.
- **Google Cloud Text-to-Speech:** For converting podcast scripts into audio.
- **PostgreSQL:** The primary database for all application data.
- **Firebase Authentication:** For user authentication and management.
- **Replit Object Storage:** For persistent storage of generated audio files.
- **Expo:** For React Native app development, building, and deployment.
- **EAS CLI:** For building and submitting iOS and Android apps to respective app stores.