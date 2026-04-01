-- Multi-tenant migration: add cities table, cityId columns, FK constraints, and seed Paris
-- Run this against a fresh or existing database to set up multi-tenant support

-- 1. Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id varchar PRIMARY KEY,
  name text NOT NULL,
  country text NOT NULL,
  app_name text NOT NULL,
  bundle_id text NOT NULL,
  contact_email text NOT NULL,
  privacy_policy_date text NOT NULL,
  localized_names jsonb NOT NULL,
  localized_country jsonb NOT NULL,
  top_level_name jsonb NOT NULL,
  user_levels jsonb NOT NULL,
  role_description jsonb,
  moderation_prompt_template text,
  moderation_reject_template text,
  walking_tour_perspective jsonb,
  modern_culture_perspective jsonb,
  created_at timestamp DEFAULT now()
);

-- 2. Seed Paris city
INSERT INTO cities (id, name, country, app_name, bundle_id, contact_email, privacy_policy_date, localized_names, localized_country, top_level_name, user_levels, role_description, moderation_prompt_template, moderation_reject_template, walking_tour_perspective, modern_culture_perspective)
VALUES (
  'paris',
  'Paris',
  'France',
  'Paris Stories',
  'app.replit.parisstories',
  'vragen@greenhome.nl',
  '2025-02-20',
  '{"en":"Paris","nl":"Parijs","fr":"Paris","de":"Paris","es":"París"}'::jsonb,
  '{"en":"France","nl":"Frankrijk","fr":"la France","de":"Frankreich","es":"Francia"}'::jsonb,
  '{"en":"Paris Stories","nl":"Paris Stories","fr":"Paris Stories","de":"Paris Stories","es":"Paris Stories"}'::jsonb,
  '[{"id":"traveler","icon":"airplane","minPodcasts":0,"name":{"en":"Traveler","nl":"Reiziger","fr":"Voyageur","de":"Reisender","es":"Viajero"},"description":{"en":"Just getting started exploring Paris","nl":"Net begonnen met het verkennen van Parijs","fr":"Vous commencez à explorer Paris","de":"Du fängst gerade an, Paris zu erkunden","es":"Acabas de empezar a explorar París"}},{"id":"explorer","icon":"compass","minPodcasts":3,"name":{"en":"Explorer","nl":"Ontdekker","fr":"Explorateur","de":"Entdecker","es":"Explorador"},"description":{"en":"Discovering the hidden gems of Paris","nl":"De verborgen parels van Parijs ontdekken","fr":"Découvrir les trésors cachés de Paris","de":"Die verborgenen Schätze von Paris entdecken","es":"Descubriendo las joyas ocultas de París"}},{"id":"connoisseur","icon":"star","minPodcasts":8,"name":{"en":"Connoisseur","nl":"Kenner","fr":"Connaisseur","de":"Kenner","es":"Conocedor"},"description":{"en":"A true connoisseur of Parisian life","nl":"Een echte kenner van het Parijse leven","fr":"Un vrai connaisseur de la vie parisienne","de":"Ein wahrer Kenner des Pariser Lebens","es":"Un verdadero conocedor de la vida parisina"}},{"id":"parisien","icon":"crown","minPodcasts":15,"name":{"en":"Parisien","nl":"Parisien","fr":"Parisien","de":"Parisien","es":"Parisien"},"description":{"en":"You know Paris like the back of your hand","nl":"Je kent Parijs als je broekzak","fr":"Vous connaissez Paris comme votre poche","de":"Du kennst Paris wie deine Westentasche","es":"Conoces París como la palma de tu mano"}}]'::jsonb,
  '{"nl": "Je bent een deskundige solo-podcastverteller. Je bent een ervaren gids die met de luisteraar door Parijs wandelt. Je vertelstijl is warm maar nuchter. Je deelt feiten en achtergronden op een toegankelijke, ontspannen manier. Je schrijft in vloeiend, natuurlijk Nederlands.", "fr": "Vous etes un narrateur de podcast solo expert. Vous etes un guide experimente qui marche dans Paris avec l''auditeur. Votre style est chaleureux mais ancre dans les faits. Vous partagez des faits et du contexte de maniere accessible et detendue. Vous ecrivez en francais fluide et naturel.", "de": "Du bist ein sachkundiger Solo-Podcast-Erzaehler. Du bist ein erfahrener Guide, der mit dem Zuhoerer durch Paris spaziert. Dein Stil ist warm, aber sachlich. Du teilst Fakten und Hintergruende auf zugaengliche, entspannte Weise. Du schreibst in fliessendem, natuerlichem Deutsch.", "es": "Eres un narrador experto de podcast en solitario. Eres un guia experimentado que camina por Paris con el oyente. Tu estilo es calido pero basado en hechos. Compartes datos y contexto de manera accesible y relajada. Escribes en espanol fluido y natural.", "en": "You are a knowledgeable solo podcast storyteller. You are an experienced guide walking through Paris with the listener. Your style is warm but grounded. You share facts and context in an accessible, relaxed way. You write in fluent, natural English."}'::jsonb,
  'You are a content moderator for a city podcast app about {city}, {country}. Determine if the following topic is appropriate.\n\nALLOW topics that are: related to {city} or {country} in any way, including local streets, squares, neighborhoods, parks, landmarks, buildings, museums, restaurants, people, events, traditions, culture, history, architecture, food, nature, or daily life. Also allow general travel, culture, and lifestyle topics. Be GENEROUS — if a topic could reasonably be about {city} or {country}, allow it.\n\nREJECT ONLY topics that are: sexually explicit, promoting violence or hate, about illegal activities, about weapons or drugs.\n\nTopic: "{subject}"\n\nRespond with ONLY "ALLOW" or "REJECT".',
  'This topic is not suitable for {appName}. Please choose a topic related to {city}, its culture, history, or daily life.',
  '{"en": "Guide the listener as if walking through Paris together. Describe what they would see, hear, and smell. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.", "nl": "Begeleid de luisteraar alsof je samen door Parijs wandelt. Beschrijf wat ze zouden zien, horen en ruiken. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details.", "fr": "Guidez l''auditeur comme si vous marchiez ensemble dans Paris. Decrivez ce qu''il verrait, entendrait et sentirait. Emmenez-le aux meilleurs endroits et aux plus celebres du quartier. Utilisez un langage directionnel et des details sensoriels vivants.", "de": "Fuehre den Zuhoerer, als wuerdet ihr gemeinsam durch Paris spazieren. Beschreibe, was er sehen, hoeren und riechen wuerde. Nimm ihn mit zu den besten und beruehmtesten Orten der Gegend. Verwende Richtungsangaben und lebendige sensorische Details.", "es": "Guia al oyente como si caminaran juntos por Paris. Describe lo que veria, escucharia y oleria. Lleva al oyente a los mejores y mas famosos lugares de la zona. Usa lenguaje direccional y detalles sensoriales vividos."}'::jsonb,
  '{"en": "Focus on contemporary culture, modern-day significance, current trends, and how this topic connects to life in Paris today.", "nl": "Focus op hedendaagse cultuur, de moderne betekenis, huidige trends en hoe dit onderwerp aansluit bij het leven in Parijs vandaag.", "fr": "Concentrez-vous sur la culture contemporaine, la signification moderne, les tendances actuelles et comment ce sujet se connecte a la vie a Paris aujourd''hui.", "de": "Konzentriere dich auf zeitgenoessische Kultur, moderne Bedeutung, aktuelle Trends und wie dieses Thema mit dem Leben im heutigen Paris zusammenhaengt.", "es": "Concentrate en la cultura contemporanea, la importancia moderna, las tendencias actuales y como este tema se conecta con la vida en el Paris de hoy."}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  role_description = EXCLUDED.role_description,
  moderation_prompt_template = EXCLUDED.moderation_prompt_template,
  moderation_reject_template = EXCLUDED.moderation_reject_template,
  walking_tour_perspective = EXCLUDED.walking_tour_perspective,
  modern_culture_perspective = EXCLUDED.modern_culture_perspective;

-- 3. Add city_id columns to existing tables (idempotent)
ALTER TABLE users ADD COLUMN IF NOT EXISTS city_id varchar NOT NULL DEFAULT 'paris';
ALTER TABLE cached_podcasts ADD COLUMN IF NOT EXISTS city_id varchar NOT NULL DEFAULT 'paris';
ALTER TABLE custom_podcasts ADD COLUMN IF NOT EXISTS city_id varchar NOT NULL DEFAULT 'paris';
ALTER TABLE user_podcasts ADD COLUMN IF NOT EXISTS city_id varchar NOT NULL DEFAULT 'paris';

-- 4. Add FK constraints (drop first if exist for idempotency)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_city_id_cities_id_fk;
ALTER TABLE users ADD CONSTRAINT users_city_id_cities_id_fk FOREIGN KEY (city_id) REFERENCES cities(id);

ALTER TABLE cached_podcasts DROP CONSTRAINT IF EXISTS cached_podcasts_city_id_cities_id_fk;
ALTER TABLE cached_podcasts ADD CONSTRAINT cached_podcasts_city_id_cities_id_fk FOREIGN KEY (city_id) REFERENCES cities(id);

ALTER TABLE custom_podcasts DROP CONSTRAINT IF EXISTS custom_podcasts_city_id_cities_id_fk;
ALTER TABLE custom_podcasts ADD CONSTRAINT custom_podcasts_city_id_cities_id_fk FOREIGN KEY (city_id) REFERENCES cities(id);

ALTER TABLE user_podcasts DROP CONSTRAINT IF EXISTS user_podcasts_city_id_cities_id_fk;
ALTER TABLE user_podcasts ADD CONSTRAINT user_podcasts_city_id_cities_id_fk FOREIGN KEY (city_id) REFERENCES cities(id);

-- 5. Drop legacy unique constraints/indexes and recreate city-scoped versions
-- Drop as both index and constraint for safety (one or the other may exist)
DROP INDEX IF EXISTS users_firebase_uid_unique;
DROP INDEX IF EXISTS users_email_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_firebase_uid_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_firebase_uid_key;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

DROP INDEX IF EXISTS users_email_city_idx;
DROP INDEX IF EXISTS users_firebase_uid_city_idx;
DROP INDEX IF EXISTS cached_podcast_lookup_idx;
DROP INDEX IF EXISTS user_podcast_lookup_idx;

CREATE UNIQUE INDEX users_email_city_idx ON users (email, city_id);
CREATE UNIQUE INDEX users_firebase_uid_city_idx ON users (firebase_uid, city_id);
CREATE UNIQUE INDEX cached_podcast_lookup_idx ON cached_podcasts (city_id, topic_id, angle, voice, language, length);
CREATE UNIQUE INDEX user_podcast_lookup_idx ON user_podcasts (city_id, user_id, cached_podcast_id);
