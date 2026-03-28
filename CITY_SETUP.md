# City Setup Guide (Multi-Tenant)

This project runs a **single server** that serves multiple city apps. Each city is a separate App Store listing with its own Expo frontend, but they all share the same backend and database. The frontend sends an `X-City-Id` header on every API request.

## How It Works

1. The `cities` table in the database holds all city configuration (name, country, app name, localized names, AI prompt config, etc.)
2. The frontend reads its city ID from `EXPO_PUBLIC_CITY_ID` env var (passed through `app.config.ts` → `expo.extra.cityId`)
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
  role_description, moderation_prompt_template, moderation_reject_template,
  walking_tour_perspective, modern_culture_perspective
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
  '[...]',  -- JSON array of user level objects (see Paris seed for format)
  '{...}',  -- JSON object with role descriptions per language (nl/fr/de/es/en)
  '...',    -- Moderation prompt template with {city}, {country}, {subject} placeholders
  '...',    -- Moderation rejection template with {appName}, {city} placeholders
  '{...}',  -- Walking tour perspective JSON per language (nl/fr/de/es/en)
  '{...}'   -- Modern culture perspective JSON per language (nl/fr/de/es/en)
);
```

See the Paris seed data in `scripts/multi-tenant-migration.sql` for the complete structure of each JSON field.

### Step 2: Build the Frontend App

The frontend is configured entirely via environment variables — no code changes are needed for app identity. Set these env vars in your EAS build profile or local environment:

| Variable | Example | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_CITY_ID` | `amsterdam` | City slug (matches `id` in cities table) |
| `EXPO_PUBLIC_APP_NAME` | `Amsterdam Stories` | App display name |
| `EXPO_PUBLIC_APP_SLUG` | `amsterdam-stories` | URL-safe app slug |
| `EXPO_PUBLIC_BUNDLE_ID` | `app.replit.amsterdamstories` | iOS bundle identifier |
| `EXPO_PUBLIC_SCHEME` | `amsterdamstories` | URL scheme for deep linking |
| `EXPO_PUBLIC_ANDROID_PACKAGE` | `com.greenhome.amsterdamstories` | Android package name |
| `EXPO_PUBLIC_API_DOMAIN` | `paris-stories.replit.app` | Shared backend domain |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | `(your EAS project ID)` | EAS project ID |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `(key)` | Firebase API key (shared or per-city) |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `(project)` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `(app id)` | Firebase app ID |

`app.config.ts` reads these env vars and configures the Expo build automatically. If a var is not set, it defaults to Paris values.

#### EAS Build Profile Example

Add a new profile to `eas.json`:

```json
{
  "build": {
    "production:amsterdam": {
      "extends": "production",
      "env": {
        "EXPO_PUBLIC_CITY_ID": "amsterdam",
        "EXPO_PUBLIC_APP_NAME": "Amsterdam Stories",
        "EXPO_PUBLIC_APP_SLUG": "amsterdam-stories",
        "EXPO_PUBLIC_BUNDLE_ID": "app.replit.amsterdamstories",
        "EXPO_PUBLIC_SCHEME": "amsterdamstories",
        "EXPO_PUBLIC_ANDROID_PACKAGE": "com.greenhome.amsterdamstories"
      }
    }
  },
  "submit": {
    "production:amsterdam": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

Then build with: `eas build --platform ios --profile production:amsterdam`

### Step 3: Update Content (per-city customization)

City identity (name, localized names, user levels) is loaded dynamically from the server via `/api/city/config`. No code changes needed for basic identity.

These files contain curated content and may need city-specific updates:

- `constants/themes.ts` — Replace all curated themes, topics, and angles
- `constants/onboarding.ts` — Update slide content for the new city
- `i18n/*.ts` — Review city-specific flavor text (most uses `%{city}` interpolation)
- `APP_STORE_METADATA.md` — Full rewrite for the new city
- Assets — Icons, splash screen, category images

### Step 4: Verify

- Test privacy policy: `/privacy-policy?city=amsterdam`
- Test podcast generation with city-specific prompts
- Test moderation accepts new-city topics
- Verify audio files stored under `podcast-audio/amsterdam/`

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
- Audio stream endpoint uses `?city=<slug>` query parameter (for native audio players)

### AI Prompts
AI prompt content (role descriptions, moderation templates, walking tour and modern culture perspectives) is stored in the `cities` table and loaded dynamically. The `server/city-prompts.ts` module provides helper functions that accept a `City` object, reading DB values first and falling back to code-generated prompts using city name interpolation.

### Object Storage
Audio files are stored under `podcast-audio/{cityId}/{filename}` in Object Storage. Legacy files under `podcast-audio/{filename}` (pre-multi-tenant) are checked as fallback for backward compatibility.

### Account Deletion
When a user deletes their account for one city, only the DB data for that city is removed. The underlying Firebase auth user is only deleted if no other city accounts remain for the same Firebase UID.

### Generation Job Isolation
Podcast generation jobs are scoped by `(userId, cityId)`. The job polling endpoint validates ownership before returning job status/results.

## Checklist for New City

- [ ] City record inserted in `cities` table with all fields
- [ ] EAS build profile created with all `EXPO_PUBLIC_*` env vars
- [ ] Verify `/api/city/config` returns correct data with `X-City-Id` header
- [ ] `constants/themes.ts` — All themes, topics, angles replaced
- [ ] `constants/onboarding.ts` — Slide content updated
- [ ] `i18n/*.ts` — City-specific text reviewed
- [ ] `eas.json` submit section — Apple credentials for new app
- [ ] Assets — Icons, splash, category images
- [ ] `APP_STORE_METADATA.md` — Full rewrite
- [ ] Privacy policy — Verify via `/privacy-policy?city=<slug>`
- [ ] Test podcast generation — Verify prompts reference new city
- [ ] Test moderation — Verify it accepts new-city topics
