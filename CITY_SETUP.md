# City Setup Guide (Multi-Tenant)

This project runs a **single server** that serves multiple city apps. Each city is a separate App Store listing with its own Expo frontend, but they all share the same backend and database. The frontend sends an `X-City-Id` header on every API request.

## How It Works

1. The `cities` table in the database holds all city configuration (name, country, app name, localized names, AI prompt config, etc.)
2. The frontend reads its city ID from `app.json` → `expo.extra.cityId` (or `EXPO_PUBLIC_CITY_ID` env var)
3. Every API request includes `X-City-Id: <citySlug>` header via `lib/query-client.ts`
4. Server middleware (`server/city-middleware.ts`) resolves the city config from DB with a 5-minute cache
5. All DB queries are scoped by `cityId` — users, podcasts, and history are city-isolated

## Adding a New City

### Step 1: Insert City Record

Insert a row into the `cities` table with all required fields:

```sql
INSERT INTO cities (
  id, name, country, app_name, bundle_id, contact_email,
  privacy_policy_date, localized_names, localized_country,
  top_level_name, user_levels,
  role_description, moderation_prompt, moderation_reject_message,
  custom_angle_perspectives, walking_tour_perspective,
  curated_user_prompt_template, custom_user_prompt_template,
  google_tts_instructions
) VALUES (
  'amsterdam',
  'Amsterdam',
  'the Netherlands',
  'Amsterdam Stories',
  'app.replit.amsterdamstories',
  'contact@example.com',
  '2025-01-01',
  '{"en":"Amsterdam","nl":"Amsterdam","fr":"Amsterdam","de":"Amsterdam","es":"Ámsterdam"}',
  '{"en":"the Netherlands","nl":"Nederland","fr":"les Pays-Bas","de":"die Niederlande","es":"los Países Bajos"}',
  '{"en":"Amsterdam Stories","nl":"Amsterdam Stories","fr":"Amsterdam Stories","de":"Amsterdam Stories","es":"Amsterdam Stories"}',
  '[...]',  -- JSON array of user level objects
  '{...}',  -- JSON object with role descriptions per language
  '...',    -- Moderation system prompt text
  '...',    -- Moderation rejection message
  '{...}',  -- Custom angle perspectives JSON
  '{...}',  -- Walking tour perspective JSON
  '...',    -- Curated user prompt template
  '...',    -- Custom user prompt template
  '{...}'   -- Google TTS instructions JSON
);
```

See the Paris seed data for the complete structure of each JSON field.

### Step 2: Create the Frontend App

1. Duplicate the Expo project (or create a new Repl)
2. Update `app.json`:
   - `name` — App display name (e.g., "Amsterdam Stories")
   - `slug` — URL-safe slug (e.g., "amsterdam-stories")
   - `ios.bundleIdentifier` — Must match `bundleId` in the city DB record
   - `expo.extra.cityId` — Set to the city slug (e.g., `"amsterdam"`)
3. Update `constants/city.ts` with the matching city identity for the frontend
4. Update `constants/themes.ts` with city-specific curated themes, topics, and angles
5. Update `constants/onboarding.ts` with city-specific slide content
6. Update assets (icon, splash, category images)

### Step 3: Configure Environment

The frontend app needs:
- `EXPO_PUBLIC_CITY_ID` — City slug (matches `id` in cities table)
- `FIREBASE_*` vars — Can share the same Firebase project or use a separate one
- The same backend URL (all cities share one server)

### Step 4: Update Content

- `constants/themes.ts` — Replace all curated themes, topics, and angles
- `constants/onboarding.ts` — Update slide content for the new city
- `i18n/*.ts` — Review city-specific flavor text (most uses `%{city}` interpolation)
- `APP_STORE_METADATA.md` — Full rewrite for the new city
- Assets — Icons, splash screen, category images

## Architecture Notes

### Database Isolation
- `users` table: unique on `(email, cityId)` — same user can have separate accounts per city
- `cached_podcasts`: unique on `(cityId, topicId, angle, voice, language, length)`
- `custom_podcasts`: scoped by `cityId` in all queries
- `user_podcasts`: unique on `(cityId, userId, cachedPodcastId)`

### Server Middleware
- `server/city-middleware.ts` extracts `X-City-Id` from request headers
- City config is loaded from DB and cached in memory for 5 minutes
- If no header is sent, defaults to `"paris"` for backward compatibility
- Privacy policy endpoint uses `?city=<slug>` query parameter

### AI Prompts
All AI prompt content (role descriptions, moderation, user prompts, TTS instructions) is stored in the `cities` table and loaded dynamically. The `server/city-prompts.ts` module provides helper functions that accept a `City` object parameter.

## Checklist for New City

- [ ] City record inserted in `cities` table with all fields
- [ ] Frontend `app.json` updated (name, slug, bundleId, cityId)
- [ ] `constants/city.ts` updated for frontend identity
- [ ] `constants/themes.ts` — All themes, topics, angles replaced
- [ ] `constants/onboarding.ts` — Slide content updated
- [ ] `i18n/*.ts` — City-specific text reviewed
- [ ] `eas.json` — Apple credentials for new app
- [ ] Assets — Icons, splash, category images
- [ ] `APP_STORE_METADATA.md` — Full rewrite
- [ ] Privacy policy — Verify via `/privacy-policy?city=<slug>`
- [ ] Test podcast generation — Verify prompts reference new city
- [ ] Test moderation — Verify it accepts new-city topics
