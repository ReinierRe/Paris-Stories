-- Migration: sync DB content with code after multi-city PR1–PR5
--
-- 1. Rename top-tier user level to "World Explorer" for all three cities.
-- 2. Backfill Barcelona row with city_highlights, thank_you_word,
--    topic_theme_map and theme_angles (Paris/Amsterdam already have these).
--
-- Run:  psql $DATABASE_URL -f scripts/migrate-pr1-5-db-sync.sql
-- Idempotent: safe to re-run.

-- ----------------------------------------------------------------------------
-- 1. World Explorer top-tier level (paris, amsterdam, barcelona)
-- ----------------------------------------------------------------------------
UPDATE cities
SET user_levels = jsonb_set(
  user_levels::jsonb,
  '{3}',
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

-- Paris top-tier minPodcasts was historically 15; keep that for Paris but
-- harmonise Amsterdam/Barcelona at 30 (already the case). For Paris we keep
-- the seed value of 15 so existing users do not regress — overwrite back:
UPDATE cities
SET user_levels = jsonb_set(user_levels::jsonb, '{3,minPodcasts}', '15'::jsonb)
WHERE id = 'paris';

-- ----------------------------------------------------------------------------
-- 2. Barcelona — backfill missing columns
-- ----------------------------------------------------------------------------
UPDATE cities
SET
  thank_you_word = COALESCE(NULLIF(thank_you_word, ''), 'Gràcies!'),
  city_highlights = COALESCE(city_highlights, '{
    "en": "Modernisme",
    "nl": "het Modernisme",
    "fr": "le Modernisme",
    "de": "den Modernismus",
    "es": "el Modernismo"
  }'::jsonb),
  topic_theme_map = COALESCE(topic_theme_map, '{
    "bcn-roman-barcino": "history",
    "bcn-counts": "history",
    "bcn-aragon": "history",
    "bcn-1714": "history",
    "bcn-renaixenca": "history",
    "bcn-1888": "history",
    "bcn-civil-war": "history",
    "bcn-franco": "history",

    "bcn-sagrada": "gaudi",
    "bcn-park-guell": "gaudi",
    "bcn-casa-batllo": "gaudi",
    "bcn-pedrera": "gaudi",
    "bcn-gaudi-life": "gaudi",
    "bcn-domenech": "gaudi",
    "bcn-trencadis": "gaudi",
    "bcn-eixample": "gaudi",

    "bcn-picasso-museum": "museums",
    "bcn-mnac": "museums",
    "bcn-miro": "museums",
    "bcn-macba": "museums",
    "bcn-history-museum": "museums",
    "bcn-cccb": "museums",
    "bcn-maritime": "museums",
    "bcn-cosmo": "museums",

    "bcn-cathedral": "epic-buildings",
    "bcn-santa-maria": "epic-buildings",
    "bcn-palau-musica": "epic-buildings",
    "bcn-arc-triomf": "epic-buildings",
    "bcn-camp-nou": "epic-buildings",
    "bcn-torre-agbar": "epic-buildings",
    "bcn-montjuic-castle": "epic-buildings",
    "bcn-columbus": "epic-buildings",

    "bcn-fcb-cruyff": "modern-history",
    "bcn-transition": "modern-history",
    "bcn-independentism": "modern-history",
    "bcn-22at": "modern-history",
    "bcn-overtourism": "modern-history",
    "bcn-superblocks": "modern-history",
    "bcn-rumba": "modern-history",
    "bcn-castellers": "modern-history",

    "bcn-gothic-quarter": "neighborhoods",
    "bcn-born": "neighborhoods",
    "bcn-raval": "neighborhoods",
    "bcn-gracia": "neighborhoods",
    "bcn-barceloneta": "neighborhoods",
    "bcn-poble-sec": "neighborhoods",
    "bcn-poblenou": "neighborhoods",
    "bcn-sant-antoni": "neighborhoods",

    "bcn-tapas": "culinary",
    "bcn-pa-amb-tomaquet": "culinary",
    "bcn-vermut": "culinary",
    "bcn-boqueria": "culinary",
    "bcn-seafood-mar": "culinary",
    "bcn-cava": "culinary",
    "bcn-crema-catalana": "culinary",
    "bcn-elbulli": "culinary"
  }'::jsonb),
  theme_angles = COALESCE(theme_angles, '{
    "history": [
      {"id":"historical","names":{"en":"Historical","nl":"Historisch","fr":"Historique","de":"Historisch","es":"Histórico"},"descriptions":{"en":"Facts, dates, and chronological storytelling","nl":"Feiten, data en chronologisch vertellen","fr":"Faits, dates et récit chronologique","de":"Fakten, Daten und chronologisches Erzählen","es":"Hechos, fechas y narración cronológica"}},
      {"id":"personal-stories","names":{"en":"Personal Stories","nl":"Persoonlijke Verhalen","fr":"Histoires personnelles","de":"Persönliche Geschichten","es":"Historias personales"},"descriptions":{"en":"The story told from the iconic figures involved","nl":"Het verhaal verteld vanuit de iconische figuren","fr":"L''histoire racontée du point de vue des personnages emblématiques","de":"Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren","es":"La historia contada desde las figuras icónicas involucradas"}}
    ],
    "gaudi": [
      {"id":"architecture","names":{"en":"Architecture & Building","nl":"Architectuur & Gebouw","fr":"Architecture & Bâtiment","de":"Architektur & Gebäude","es":"Arquitectura & Edificio"},"descriptions":{"en":"The architectural story and design of the building itself","nl":"Het architectuurverhaal en het ontwerp van het gebouw zelf","fr":"L''histoire architecturale et le design du bâtiment lui-même","de":"Die architektonische Geschichte und Gestaltung des Gebäudes selbst","es":"La historia arquitectónica y el diseño del edificio en sí"}},
      {"id":"personal-stories","names":{"en":"Personal Stories","nl":"Persoonlijke Verhalen","fr":"Histoires personnelles","de":"Persönliche Geschichten","es":"Historias personales"},"descriptions":{"en":"The story told from the iconic figures involved","nl":"Het verhaal verteld vanuit de iconische figuren","fr":"L''histoire racontée du point de vue des personnages emblématiques","de":"Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren","es":"La historia contada desde las figuras icónicas involucradas"}},
      {"id":"walking-tour","names":{"en":"Walking Tour","nl":"Wandeltour","fr":"Visite à pied","de":"Rundgang","es":"Paseo guiado"},"descriptions":{"en":"A guided walk past the best and most famous places in the area","nl":"Een begeleide wandeling langs de beste en beroemdste plekken","fr":"Une promenade guidée devant les meilleurs endroits du quartier","de":"Ein geführter Spaziergang an den besten und berühmtesten Orten","es":"Un paseo guiado por los mejores y más famosos lugares de la zona"}}
    ],
    "museums": [
      {"id":"origin","names":{"en":"Origin of the Museum","nl":"Ontstaan van het Museum","fr":"Origine du Musée","de":"Ursprung des Museums","es":"Origen del Museo"},"descriptions":{"en":"The founding story and how the museum came to be","nl":"Het ontstaansverhaal en hoe het museum tot stand kwam","fr":"L''histoire de sa fondation et comment le musée est né","de":"Die Gründungsgeschichte und wie das Museum entstand","es":"La historia de su fundación y cómo nació el museo"}},
      {"id":"prominent-art","names":{"en":"Prominent Art Pieces","nl":"Prominente Kunstwerken","fr":"Œuvres d''art emblématiques","de":"Bedeutende Kunstwerke","es":"Obras de arte destacadas"},"descriptions":{"en":"The most famous and significant works in the collection","nl":"De beroemdste en belangrijkste werken in de collectie","fr":"Les œuvres les plus célèbres et les plus importantes de la collection","de":"Die berühmtesten und bedeutendsten Werke der Sammlung","es":"Las obras más famosas e importantes de la colección"}},
      {"id":"architecture","names":{"en":"Architecture & Building","nl":"Architectuur & Gebouw","fr":"Architecture & Bâtiment","de":"Architektur & Gebäude","es":"Arquitectura & Edificio"},"descriptions":{"en":"The architectural story and design of the building itself","nl":"Het architectuurverhaal en het ontwerp van het gebouw zelf","fr":"L''histoire architecturale et le design du bâtiment lui-même","de":"Die architektonische Geschichte und Gestaltung des Gebäudes selbst","es":"La historia arquitectónica y el diseño del edificio en sí"}}
    ],
    "epic-buildings": [
      {"id":"architecture","names":{"en":"Architecture & Building","nl":"Architectuur & Gebouw","fr":"Architecture & Bâtiment","de":"Architektur & Gebäude","es":"Arquitectura & Edificio"},"descriptions":{"en":"The architectural story and design of the building itself","nl":"Het architectuurverhaal en het ontwerp van het gebouw zelf","fr":"L''histoire architecturale et le design du bâtiment lui-même","de":"Die architektonische Geschichte und Gestaltung des Gebäudes selbst","es":"La historia arquitectónica y el diseño del edificio en sí"}},
      {"id":"historical","names":{"en":"Historical","nl":"Historisch","fr":"Historique","de":"Historisch","es":"Histórico"},"descriptions":{"en":"Facts, dates, and chronological storytelling","nl":"Feiten, data en chronologisch vertellen","fr":"Faits, dates et récit chronologique","de":"Fakten, Daten und chronologisches Erzählen","es":"Hechos, fechas y narración cronológica"}},
      {"id":"walking-tour","names":{"en":"Walking Tour","nl":"Wandeltour","fr":"Visite à pied","de":"Rundgang","es":"Paseo guiado"},"descriptions":{"en":"A guided walk past the best and most famous places in the area","nl":"Een begeleide wandeling langs de beste en beroemdste plekken","fr":"Une promenade guidée devant les meilleurs endroits du quartier","de":"Ein geführter Spaziergang an den besten und berühmtesten Orten","es":"Un paseo guiado por los mejores y más famosos lugares de la zona"}}
    ],
    "modern-history": [
      {"id":"historical","names":{"en":"Historical","nl":"Historisch","fr":"Historique","de":"Historisch","es":"Histórico"},"descriptions":{"en":"Facts, dates, and chronological storytelling","nl":"Feiten, data en chronologisch vertellen","fr":"Faits, dates et récit chronologique","de":"Fakten, Daten und chronologisches Erzählen","es":"Hechos, fechas y narración cronológica"}},
      {"id":"cultural","names":{"en":"Cultural","nl":"Cultureel","fr":"Culturel","de":"Kulturell","es":"Cultural"},"descriptions":{"en":"Art, food, lifestyle, and cultural significance","nl":"Kunst, eten, levensstijl en culturele betekenis","fr":"Art, gastronomie, mode de vie et importance culturelle","de":"Kunst, Essen, Lebensstil und kulturelle Bedeutung","es":"Arte, gastronomía, estilo de vida e importancia cultural"}},
      {"id":"modern-times","names":{"en":"Modern Times","nl":"Moderne Tijd","fr":"Époque moderne","de":"Moderne Zeit","es":"Tiempos modernos"},"descriptions":{"en":"What this topic looks like today and how it has evolved","nl":"Hoe dit onderwerp er vandaag uitziet en hoe het is geëvolueerd","fr":"À quoi ressemble ce sujet aujourd''hui et comment il a évolué","de":"Wie dieses Thema heute aussieht und wie es sich entwickelt hat","es":"Cómo se ve este tema hoy y cómo ha evolucionado"}}
    ],
    "neighborhoods": [
      {"id":"historical","names":{"en":"Historical","nl":"Historisch","fr":"Historique","de":"Historisch","es":"Histórico"},"descriptions":{"en":"The origins and historical evolution of this neighborhood","nl":"De oorsprong en historische ontwikkeling van deze buurt","fr":"Les origines et l''évolution historique de ce quartier","de":"Die Ursprünge und die historische Entwicklung dieses Viertels","es":"Los orígenes y la evolución histórica de este barrio"}},
      {"id":"cultural","names":{"en":"Cultural","nl":"Cultureel","fr":"Culturel","de":"Kulturell","es":"Cultural"},"descriptions":{"en":"Art, food, lifestyle, and cultural significance","nl":"Kunst, eten, levensstijl en culturele betekenis","fr":"Art, gastronomie, mode de vie et importance culturelle","de":"Kunst, Essen, Lebensstil und kulturelle Bedeutung","es":"Arte, gastronomía, estilo de vida e importancia cultural"}},
      {"id":"modern-times","names":{"en":"Modern Times","nl":"Moderne Tijd","fr":"Époque moderne","de":"Moderne Zeit","es":"Tiempos modernos"},"descriptions":{"en":"What the neighborhood looks like today and how it has evolved","nl":"Hoe de buurt er vandaag uitziet en hoe deze is geëvolueerd","fr":"À quoi ressemble le quartier aujourd''hui et comment il a évolué","de":"Wie das Viertel heute aussieht und wie es sich entwickelt hat","es":"Cómo se ve el barrio hoy y cómo ha evolucionado"}},
      {"id":"walking-tour","names":{"en":"Walking Tour","nl":"Wandeltour","fr":"Visite à pied","de":"Rundgang","es":"Paseo guiado"},"descriptions":{"en":"A guided walk past the best and most famous places in the area","nl":"Een begeleide wandeling langs de beste en beroemdste plekken","fr":"Une promenade guidée devant les meilleurs endroits du quartier","de":"Ein geführter Spaziergang an den besten und berühmtesten Orten","es":"Un paseo guiado por los mejores y más famosos lugares de la zona"}}
    ],
    "culinary": [
      {"id":"cultural","names":{"en":"Cultural","nl":"Cultureel","fr":"Culturel","de":"Kulturell","es":"Cultural"},"descriptions":{"en":"How this dish or drink fits into Catalan culture and daily life","nl":"Hoe dit gerecht of deze drank past in de Catalaanse cultuur en het dagelijks leven","fr":"Comment ce plat ou cette boisson s''inscrit dans la culture catalane et la vie quotidienne","de":"Wie dieses Gericht oder Getränk zur katalanischen Kultur und zum Alltag gehört","es":"Cómo este plato o bebida encaja en la cultura catalana y la vida diaria"}},
      {"id":"historical","names":{"en":"Historical","nl":"Historisch","fr":"Historique","de":"Historisch","es":"Histórico"},"descriptions":{"en":"The origins and historical evolution of this culinary tradition","nl":"De oorsprong en historische ontwikkeling van deze culinaire traditie","fr":"Les origines et l''évolution historique de cette tradition culinaire","de":"Die Ursprünge und historische Entwicklung dieser kulinarischen Tradition","es":"Los orígenes y la evolución histórica de esta tradición culinaria"}},
      {"id":"modern-times","names":{"en":"Modern Times","nl":"Moderne Tijd","fr":"Époque moderne","de":"Moderne Zeit","es":"Tiempos modernos"},"descriptions":{"en":"How this tradition is enjoyed in Barcelona today","nl":"Hoe deze traditie vandaag in Barcelona wordt beleefd","fr":"Comment cette tradition se vit à Barcelone aujourd''hui","de":"Wie diese Tradition heute in Barcelona gelebt wird","es":"Cómo se vive esta tradición en la Barcelona de hoy"}}
    ]
  }'::jsonb)
WHERE id = 'barcelona';

-- ----------------------------------------------------------------------------
-- Verify
-- ----------------------------------------------------------------------------
SELECT id,
       user_levels->3->>'id'                          AS top_level_id,
       user_levels->3->>'minPodcasts'                 AS top_level_min,
       thank_you_word                                 AS thanks,
       city_highlights->>'en'                         AS highlight_en,
       jsonb_array_length(COALESCE(theme_angles->'history','[]'::jsonb)) AS history_angles,
       (SELECT count(*) FROM jsonb_object_keys(COALESCE(topic_theme_map,'{}'::jsonb))) AS topic_count
FROM cities
WHERE id IN ('paris','amsterdam','barcelona')
ORDER BY id;
