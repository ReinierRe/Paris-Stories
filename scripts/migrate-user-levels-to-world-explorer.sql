-- Migration: rename top-tier user level to "World Explorer" across all cities
--
-- The top-tier level was previously city-specific (Parisien / Amsterdammer / Barcelonés).
-- In multi-city this felt off — we want a neutral, aspirational top tier.
--
-- Run this in your Replit Postgres shell:
--   psql $DATABASE_URL -f scripts/migrate-user-levels-to-world-explorer.sql
--
-- This is idempotent — safe to re-run.

UPDATE cities
SET user_levels = jsonb_set(
  user_levels::jsonb,
  '{3}',  -- 4th element (zero-indexed) is the top tier
  '{
    "id": "world-explorer",
    "icon": "earth",
    "minPodcasts": 30,
    "name": {
      "en": "World Explorer",
      "nl": "Wereldreiziger",
      "fr": "Voyageur du Monde",
      "de": "Weltentdecker",
      "es": "Explorador del Mundo"
    },
    "description": {
      "en": "A seasoned traveler with cities in your pocket",
      "nl": "Een doorgewinterde reiziger met steden in je broekzak",
      "fr": "Un voyageur aguerri avec les villes en poche",
      "de": "Ein erfahrener Reisender mit Städten in der Tasche",
      "es": "Un viajero experimentado con ciudades en el bolsillo"
    }
  }'::jsonb,
  true
)
WHERE id IN ('paris', 'amsterdam', 'barcelona');

-- Verify
SELECT id, user_levels->3->>'id' AS top_level_id, user_levels->3->'name'->>'en' AS top_level_name_en
FROM cities
WHERE id IN ('paris', 'amsterdam', 'barcelona');
