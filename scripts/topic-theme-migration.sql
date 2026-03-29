-- Topic-Theme Migration: Add columns and populate topicThemeMap, themeAngles, perspectivePrompts

ALTER TABLE cities ADD COLUMN IF NOT EXISTS topic_theme_map jsonb;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS theme_angles jsonb;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS perspective_prompts jsonb;

-- Paris: topic_theme_map
UPDATE cities SET topic_theme_map = '{
  "bastille": "revolution", "bastille-walk": "revolution", "marie-antoinette": "revolution",
  "danton": "revolution", "reign-of-terror": "revolution", "conciergerie-walk": "revolution",
  "napoleon": "revolution", "charlotte-corday": "revolution",
  "louvre": "museums", "orsay": "museums", "pompidou": "museums", "orangerie": "museums",
  "bourse-commerce": "museums", "rodin": "museums", "fondation-lv": "museums", "musee-carnavalet": "museums",
  "montmartre": "neighborhoods", "montmartre-walk": "neighborhoods", "le-marais": "neighborhoods",
  "pigalle": "neighborhoods", "saint-germain": "neighborhoods", "latin-quarter": "neighborhoods",
  "belleville": "neighborhoods", "ile-de-la-cite": "neighborhoods"
}'::jsonb WHERE id = 'paris';

-- Amsterdam: topic_theme_map
UPDATE cities SET topic_theme_map = '{
  "ams-rembrandt": "golden-age", "ams-rembrandt-walk": "golden-age", "ams-canal-ring": "golden-age",
  "ams-tulipmania": "golden-age", "ams-spinoza": "golden-age", "ams-jordaan-golden-age": "golden-age",
  "ams-east-india-house": "golden-age", "ams-free-haven": "golden-age",
  "ams-rijksmuseum": "museums", "ams-van-gogh": "museums", "ams-stedelijk": "museums",
  "ams-anne-frank": "museums", "ams-scheepvaart": "museums", "ams-hermitage": "museums",
  "ams-nemo": "museums", "ams-rembrandthuis": "museums",
  "ams-jordaan": "neighborhoods", "ams-de-pijp": "neighborhoods", "ams-noord": "neighborhoods",
  "ams-de-wallen": "neighborhoods", "ams-oud-west": "neighborhoods", "ams-plantagebuurt": "neighborhoods",
  "ams-zuid": "neighborhoods", "ams-bijlmer": "neighborhoods"
}'::jsonb WHERE id = 'amsterdam';

-- Paris: theme_angles (revolution, museums, neighborhoods)
UPDATE cities SET theme_angles = $JSON$
{
  "revolution": [
    { "id": "historical", "names": { "en": "Historical", "nl": "Historisch", "fr": "Historique", "de": "Historisch", "es": "Histórico" }, "descriptions": { "en": "Facts, dates, and chronological storytelling", "nl": "Feiten, data en chronologisch vertellen", "fr": "Faits, dates et récit chronologique", "de": "Fakten, Daten und chronologisches Erzählen", "es": "Hechos, fechas y narración cronológica" } },
    { "id": "personal-stories", "names": { "en": "Personal Stories", "nl": "Persoonlijke Verhalen", "fr": "Histoires personnelles", "de": "Persönliche Geschichten", "es": "Historias personales" }, "descriptions": { "en": "The story told from the iconic figures involved", "nl": "Het verhaal verteld vanuit de iconische figuren", "fr": "L'histoire racontée du point de vue des personnages emblématiques", "de": "Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren", "es": "La historia contada desde las figuras icónicas involucradas" } }
  ],
  "museums": [
    { "id": "origin", "names": { "en": "Origin of the Museum", "nl": "Ontstaan van het Museum", "fr": "Origine du Musée", "de": "Ursprung des Museums", "es": "Origen del Museo" }, "descriptions": { "en": "The founding story and how the museum came to be", "nl": "Het ontstaansverhaal en hoe het museum tot stand kwam", "fr": "L'histoire de sa fondation et comment le musée est né", "de": "Die Gründungsgeschichte und wie das Museum entstand", "es": "La historia de su fundación y cómo nació el museo" } },
    { "id": "prominent-art", "names": { "en": "Prominent Art Pieces", "nl": "Prominente Kunstwerken", "fr": "Œuvres d'art emblématiques", "de": "Bedeutende Kunstwerke", "es": "Obras de arte destacadas" }, "descriptions": { "en": "The most famous and significant works in the collection", "nl": "De beroemdste en belangrijkste werken in de collectie", "fr": "Les œuvres les plus célèbres et les plus importantes de la collection", "de": "Die berühmtesten und bedeutendsten Werke der Sammlung", "es": "Las obras más famosas e importantes de la colección" } },
    { "id": "architecture", "names": { "en": "Architecture & Building", "nl": "Architectuur & Gebouw", "fr": "Architecture & Bâtiment", "de": "Architektur & Gebäude", "es": "Arquitectura & Edificio" }, "descriptions": { "en": "The architectural story and design of the building itself", "nl": "Het architectuurverhaal en het ontwerp van het gebouw zelf", "fr": "L'histoire architecturale et le design du bâtiment lui-même", "de": "Die architektonische Geschichte und Gestaltung des Gebäudes selbst", "es": "La historia arquitectónica y el diseño del edificio en sí" } }
  ],
  "neighborhoods": [
    { "id": "historical", "names": { "en": "Historical", "nl": "Historisch", "fr": "Historique", "de": "Historisch", "es": "Histórico" }, "descriptions": { "en": "The origins and historical evolution of this neighborhood", "nl": "De oorsprong en historische ontwikkeling van deze buurt", "fr": "Les origines et l'évolution historique de ce quartier", "de": "Die Ursprünge und die historische Entwicklung dieses Viertels", "es": "Los orígenes y la evolución histórica de este barrio" } },
    { "id": "cultural", "names": { "en": "Cultural", "nl": "Cultureel", "fr": "Culturel", "de": "Kulturell", "es": "Cultural" }, "descriptions": { "en": "Art, food, lifestyle, and cultural significance", "nl": "Kunst, eten, levensstijl en culturele betekenis", "fr": "Art, gastronomie, mode de vie et importance culturelle", "de": "Kunst, Essen, Lebensstil und kulturelle Bedeutung", "es": "Arte, gastronomía, estilo de vida e importancia cultural" } },
    { "id": "modern-times", "names": { "en": "Modern Times", "nl": "Moderne Tijd", "fr": "Époque moderne", "de": "Moderne Zeit", "es": "Tiempos modernos" }, "descriptions": { "en": "What the neighborhood looks like today and how it has evolved", "nl": "Hoe de buurt er vandaag uitziet en hoe deze is geëvolueerd", "fr": "À quoi ressemble le quartier aujourd'hui et comment il a évolué", "de": "Wie das Viertel heute aussieht und wie es sich entwickelt hat", "es": "Cómo se ve el barrio hoy y cómo ha evolucionado" } },
    { "id": "walking-tour", "names": { "en": "Walking Tour", "nl": "Wandeltour", "fr": "Visite à pied", "de": "Rundgang", "es": "Paseo guiado" }, "descriptions": { "en": "A guided walk past the best and most famous places in the area", "nl": "Een begeleide wandeling langs de beste en beroemdste plekken", "fr": "Une promenade guidée devant les meilleurs endroits du quartier", "de": "Ein geführter Spaziergang an den besten und berühmtesten Orten", "es": "Un paseo guiado por los mejores y más famosos lugares de la zona" } }
  ]
}
$JSON$::jsonb WHERE id = 'paris';

-- Amsterdam: theme_angles (golden-age, museums, neighborhoods)
UPDATE cities SET theme_angles = $JSON$
{
  "golden-age": [
    { "id": "historical", "names": { "en": "Historical", "nl": "Historisch", "fr": "Historique", "de": "Historisch", "es": "Histórico" }, "descriptions": { "en": "Facts, dates, and chronological storytelling", "nl": "Feiten, data en chronologisch vertellen", "fr": "Faits, dates et récit chronologique", "de": "Fakten, Daten und chronologisches Erzählen", "es": "Hechos, fechas y narración cronológica" } },
    { "id": "personal-stories", "names": { "en": "Personal Stories", "nl": "Persoonlijke Verhalen", "fr": "Histoires personnelles", "de": "Persönliche Geschichten", "es": "Historias personales" }, "descriptions": { "en": "The story told from the iconic figures involved", "nl": "Het verhaal verteld vanuit de iconische figuren", "fr": "L'histoire racontée du point de vue des personnages emblématiques", "de": "Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren", "es": "La historia contada desde las figuras icónicas involucradas" } }
  ],
  "museums": [
    { "id": "origin", "names": { "en": "Origin of the Museum", "nl": "Ontstaan van het Museum", "fr": "Origine du Musée", "de": "Ursprung des Museums", "es": "Origen del Museo" }, "descriptions": { "en": "The founding story and how the museum came to be", "nl": "Het ontstaansverhaal en hoe het museum tot stand kwam", "fr": "L'histoire de sa fondation et comment le musée est né", "de": "Die Gründungsgeschichte und wie das Museum entstand", "es": "La historia de su fundación y cómo nació el museo" } },
    { "id": "prominent-art", "names": { "en": "Prominent Art Pieces", "nl": "Prominente Kunstwerken", "fr": "Œuvres d'art emblématiques", "de": "Bedeutende Kunstwerke", "es": "Obras de arte destacadas" }, "descriptions": { "en": "The most famous and significant works in the collection", "nl": "De beroemdste en belangrijkste werken in de collectie", "fr": "Les œuvres les plus célèbres et les plus importantes de la collection", "de": "Die berühmtesten und bedeutendsten Werke der Sammlung", "es": "Las obras más famosas e importantes de la colección" } },
    { "id": "architecture", "names": { "en": "Architecture & Building", "nl": "Architectuur & Gebouw", "fr": "Architecture & Bâtiment", "de": "Architektur & Gebäude", "es": "Arquitectura & Edificio" }, "descriptions": { "en": "The architectural story and design of the building itself", "nl": "Het architectuurverhaal en het ontwerp van het gebouw zelf", "fr": "L'histoire architecturale et le design du bâtiment lui-même", "de": "Die architektonische Geschichte und Gestaltung des Gebäudes selbst", "es": "La historia arquitectónica y el diseño del edificio en sí" } }
  ],
  "neighborhoods": [
    { "id": "historical", "names": { "en": "Historical", "nl": "Historisch", "fr": "Historique", "de": "Historisch", "es": "Histórico" }, "descriptions": { "en": "The origins and historical evolution of this neighborhood", "nl": "De oorsprong en historische ontwikkeling van deze buurt", "fr": "Les origines et l'évolution historique de ce quartier", "de": "Die Ursprünge und die historische Entwicklung dieses Viertels", "es": "Los orígenes y la evolución histórica de este barrio" } },
    { "id": "cultural", "names": { "en": "Cultural", "nl": "Cultureel", "fr": "Culturel", "de": "Kulturell", "es": "Cultural" }, "descriptions": { "en": "Art, food, lifestyle, and cultural significance", "nl": "Kunst, eten, levensstijl en culturele betekenis", "fr": "Art, gastronomie, mode de vie et importance culturelle", "de": "Kunst, Essen, Lebensstil und kulturelle Bedeutung", "es": "Arte, gastronomía, estilo de vida e importancia cultural" } },
    { "id": "modern-times", "names": { "en": "Modern Times", "nl": "Moderne Tijd", "fr": "Époque moderne", "de": "Moderne Zeit", "es": "Tiempos modernos" }, "descriptions": { "en": "What the neighborhood looks like today and how it has evolved", "nl": "Hoe de buurt er vandaag uitziet en hoe deze is geëvolueerd", "fr": "À quoi ressemble le quartier aujourd'hui et comment il a évolué", "de": "Wie das Viertel heute aussieht und wie es sich entwickelt hat", "es": "Cómo se ve el barrio hoy y cómo ha evolucionado" } },
    { "id": "walking-tour", "names": { "en": "Walking Tour", "nl": "Wandeltour", "fr": "Visite à pied", "de": "Rundgang", "es": "Paseo guiado" }, "descriptions": { "en": "A guided walk past the best and most famous places in the area", "nl": "Een begeleide wandeling langs de beste en beroemdste plekken", "fr": "Une promenade guidée devant les meilleurs endroits du quartier", "de": "Ein geführter Spaziergang an den besten und berühmtesten Orten", "es": "Un paseo guiado por los mejores y más famosos lugares de la zona" } }
  ]
}
$JSON$::jsonb WHERE id = 'amsterdam';

-- perspective_prompts stays NULL for both cities — the generic curatedPerspectiveMap in code serves as default.
-- Fallback chain: city.perspectivePrompts[angle][lang] → curatedPerspectiveMap[angle][lang] → defaultStyle[lang]
