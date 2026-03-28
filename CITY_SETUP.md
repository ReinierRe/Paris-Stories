# City Setup Guide

How to fork this project for a new city (e.g., "Amsterdam Stories", "Rome Stories").

## Step 1: Update City Configuration

### `constants/city.ts` (frontend)
Single source of truth for the app identity. Update all fields:
- `id` — lowercase city slug (e.g., `"amsterdam"`)
- `name` — English city name (e.g., `"Amsterdam"`)
- `country` — English country name
- `appName` — Display name (e.g., `"Amsterdam Stories"`)
- `bundleId` — iOS bundle ID (e.g., `"app.replit.amsterdamstories"`)
- `contactEmail` — Privacy policy contact
- `privacyPolicyDate` — Date of last privacy policy update
- `localizedNames` — City name in each language (EN/NL/FR/DE/ES)
- `localizedCountry` — Country name in each language
- `topLevelName` — App name per language (usually the same across languages)
- `userLevels` — Gamification levels with city-specific names and descriptions
  - The final level name should reflect the city (e.g., "Amsterdammer", "Romano")
  - Descriptions should reference the city name in each language

### `server/city-prompts.ts` (backend)
Server-side prompt config that **imports identity from `constants/city.ts`** — no duplication needed. The `name`, `country`, `appName`, `contactEmail`, `privacyPolicyDate`, `localizedNames`, and `localizedCountry` fields are all derived from `constants/city.ts` automatically.

These values flow into: AI system prompts (role descriptions), content moderation, user prompts, and the privacy policy page. No separate update needed — just update `constants/city.ts`.

## Step 2: Update Curated Content

### `constants/themes.ts`
Replace all curated themes, topics, and angles with city-specific content:
- Theme categories (e.g., History, Museums, Neighborhoods)
- Individual topics within each theme
- Topic names and descriptions in all 5 languages
- Theme-specific angles (e.g., walking tours for relevant landmarks)

### `constants/onboarding.ts`
Update onboarding slide content if the city warrants different highlights:
- Slide subtitles reference city-specific features (e.g., "French Revolution")
- Category icon labels should match the new themes

### `app/login.tsx`
The mockup content in the onboarding slides uses hardcoded example data:
- `SlideContent` index 1: Example podcast items (topics, categories)
- `SlideContent` index 3: Example custom podcast subject text

## Step 3: Update i18n Strings

The i18n files (`i18n/en.ts`, `i18n/nl.ts`, etc.) use `%{city}` interpolation for city-specific strings. These are automatically populated from `constants/city.ts` via the `useTranslation` hook — no manual changes needed for the city name.

However, review these keys for city-specific flavor text that may need updating:
- `profile.appDescription` — References city-specific landmarks
- `customize.levelUpMessage` — Uses `%{city}` (automatic)
- All keys containing `%{city}` are handled automatically

## Step 4: Update AI Prompts

### `server/routes.ts`
The system prompts in `getSystemPrompt()` and custom podcast prompts contain:
- **Role descriptions** — Now centralized via `getRoleDescription()` from `server/city-prompts.ts`
- **Perspective maps** — Some are city-neutral, but `walking-tour` references the city via `getWalkingTourPerspective()`
- **Custom angle perspectives** — `modern-culture` references the city via `getCustomAnglePerspectives()`
- **Content moderation** — Uses `getModerationPrompt()` which references city/country
- **User prompts** — Use `getCuratedUserPrompt()` and `getCustomUserPrompts()`

Review the perspective map entries that are NOT centralized (they are city-neutral):
- `historical`, `personal-stories`, `modern-times`, `origin`, `prominent-art`, `architecture`

## Step 5: Update App Configuration

### `app.json`
- `name` — App display name
- `slug` — URL-safe slug
- `ios.bundleIdentifier` — Must match `bundleId` in `constants/city.ts`

### `eas.json`
- Update Apple Team ID, App Store Connect App ID if using a different Apple account

### Environment Variables
- Firebase project — Create a new Firebase project for each city app
- All `FIREBASE_*` secrets need updating
- Database — Each city app needs its own PostgreSQL database

## Step 6: Update Assets

### `assets/`
- App icon (`icon.png`, `adaptive-icon.png`)
- Splash screen (`splash-icon.png`)
- Category images (`assets/images/category-*.png`) — Should reflect the new city's themes

### `APP_STORE_METADATA.md`
- Rewrite all metadata for the new city in all languages
- Update screenshots
- Update keywords

## Checklist

- [ ] `constants/city.ts` — All fields updated (single source of truth for both frontend and backend)
- [ ] `constants/themes.ts` — All themes, topics, angles replaced
- [ ] `constants/onboarding.ts` — Slide content reviewed
- [ ] `app/login.tsx` — Mockup examples updated
- [ ] `i18n/*.ts` — City-specific flavor text reviewed
- [ ] `app.json` — Name, slug, bundleIdentifier
- [ ] `eas.json` — Apple credentials
- [ ] Environment variables — Firebase, database
- [ ] Assets — Icons, splash, category images
- [ ] `APP_STORE_METADATA.md` — Full rewrite
- [ ] Privacy policy — Verify via `/privacy-policy` endpoint
- [ ] Test podcast generation — Verify prompts reference new city
- [ ] Test moderation — Verify it accepts new-city topics and rejects unrelated ones
