import { db } from "./storage";
import { cities } from "@shared/schema";
import { count } from "drizzle-orm";

const PARIS_CITY = {
  id: "paris",
  name: "Paris",
  country: "France",
  appName: "Paris Stories",
  bundleId: "app.replit.parisstories",
  contactEmail: "vragen@greenhome.nl",
  privacyPolicyDate: "2025-02-20",
  localizedNames: { en: "Paris", nl: "Parijs", fr: "Paris", de: "Paris", es: "París" },
  localizedCountry: { en: "France", nl: "Frankrijk", fr: "la France", de: "Frankreich", es: "Francia" },
  topLevelName: { en: "Paris Stories", nl: "Paris Stories", fr: "Paris Stories", de: "Paris Stories", es: "Paris Stories" },
  userLevels: [
    { id: "traveler", icon: "airplane", minPodcasts: 0, name: { en: "Traveler", nl: "Reiziger", fr: "Voyageur", de: "Reisender", es: "Viajero" }, description: { en: "Just getting started exploring Paris", nl: "Net begonnen met het verkennen van Parijs", fr: "Vous commencez à explorer Paris", de: "Du fängst gerade an, Paris zu erkunden", es: "Acabas de empezar a explorar París" } },
    { id: "explorer", icon: "compass", minPodcasts: 3, name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" }, description: { en: "Discovering the hidden gems of Paris", nl: "De verborgen parels van Parijs ontdekken", fr: "Découvrir les trésors cachés de Paris", de: "Die verborgenen Schätze von Paris entdecken", es: "Descubriendo las joyas ocultas de París" } },
    { id: "connoisseur", icon: "star", minPodcasts: 8, name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" }, description: { en: "A true connoisseur of Parisian life", nl: "Een echte kenner van het Parijse leven", fr: "Un vrai connaisseur de la vie parisienne", de: "Ein wahrer Kenner des Pariser Lebens", es: "Un verdadero conocedor de la vida parisina" } },
    { id: "world-explorer", icon: "earth", minPodcasts: 15, name: { en: "World Explorer", nl: "Wereldreiziger", fr: "Voyageur du Monde", de: "Weltentdecker", es: "Explorador del Mundo" }, description: { en: "A seasoned traveler with cities in your pocket", nl: "Een doorgewinterde reiziger met steden in je broekzak", fr: "Un voyageur aguerri avec les villes en poche", de: "Ein erfahrener Reisender mit Städten in der Tasche", es: "Un viajero experimentado con ciudades en el bolsillo" } },
  ],
  roleDescription: {
    nl: "Je bent een deskundige solo-podcastverteller. Je bent een ervaren gids die met de luisteraar door Parijs wandelt. Je vertelstijl is warm maar nuchter. Je deelt feiten en achtergronden op een toegankelijke, ontspannen manier. Je schrijft in vloeiend, natuurlijk Nederlands.",
    fr: "Vous etes un narrateur de podcast solo expert. Vous etes un guide experimente qui marche dans Paris avec l'auditeur. Votre style est chaleureux mais ancre dans les faits. Vous partagez des faits et du contexte de maniere accessible et detendue. Vous ecrivez en francais fluide et naturel.",
    de: "Du bist ein sachkundiger Solo-Podcast-Erzaehler. Du bist ein erfahrener Guide, der mit dem Zuhoerer durch Paris spaziert. Dein Stil ist warm, aber sachlich. Du teilst Fakten und Hintergruende auf zugaengliche, entspannte Weise. Du schreibst in fliessendem, natuerlichem Deutsch.",
    es: "Eres un narrador experto de podcast en solitario. Eres un guia experimentado que camina por Paris con el oyente. Tu estilo es calido pero basado en hechos. Compartes datos y contexto de manera accesible y relajada. Escribes en espanol fluido y natural.",
    en: "You are a knowledgeable solo podcast storyteller. You are an experienced guide walking through Paris with the listener. Your style is warm but grounded. You share facts and context in an accessible, relaxed way. You write in fluent, natural English.",
  },
  moderationPromptTemplate: `You are a content moderator for a city podcast app about {city}, {country}. Determine if the following topic is appropriate.\n\nALLOW topics that are: related to {city} or {country} in any way, including local streets, squares, neighborhoods, parks, landmarks, buildings, museums, restaurants, people, events, traditions, culture, history, architecture, food, nature, or daily life. Also allow general travel, culture, and lifestyle topics. Be GENEROUS — if a topic could reasonably be about {city} or {country}, allow it.\n\nREJECT ONLY topics that are: sexually explicit, promoting violence or hate, about illegal activities, about weapons or drugs.\n\nTopic: "{subject}"\n\nRespond with ONLY "ALLOW" or "REJECT".`,
  moderationRejectTemplate: "This topic is not suitable for {appName}. Please choose a topic related to {city}, its culture, history, or daily life.",
  walkingTourPerspective: {
    en: "Guide the listener as if walking through Paris together. Describe what they would see, hear, and smell. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.",
    nl: "Begeleid de luisteraar alsof je samen door Parijs wandelt. Beschrijf wat ze zouden zien, horen en ruiken. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details.",
    fr: "Guidez l'auditeur comme si vous marchiez ensemble dans Paris. Decrivez ce qu'il verrait, entendrait et sentirait. Emmenez-le aux meilleurs endroits et aux plus celebres du quartier. Utilisez un langage directionnel et des details sensoriels vivants.",
    de: "Fuehre den Zuhoerer, als wuerdet ihr gemeinsam durch Paris spazieren. Beschreibe, was er sehen, hoeren und riechen wuerde. Nimm ihn mit zu den besten und beruehmtesten Orten der Gegend. Verwende Richtungsangaben und lebendige sensorische Details.",
    es: "Guia al oyente como si caminaran juntos por Paris. Describe lo que veria, escucharia y oleria. Lleva al oyente a los mejores y mas famosos lugares de la zona. Usa lenguaje direccional y detalles sensoriales vividos.",
  },
  modernCulturePerspective: {
    en: "Focus on contemporary culture, modern-day significance, current trends, and how this topic connects to life in Paris today.",
    nl: "Focus op hedendaagse cultuur, de moderne betekenis, huidige trends en hoe dit onderwerp aansluit bij het leven in Parijs vandaag.",
    fr: "Concentrez-vous sur la culture contemporaine, la signification moderne, les tendances actuelles et comment ce sujet se connecte a la vie a Paris aujourd'hui.",
    de: "Konzentriere dich auf zeitgenoessische Kultur, moderne Bedeutung, aktuelle Trends und wie dieses Thema mit dem Leben im heutigen Paris zusammenhaengt.",
    es: "Concentrate en la cultura contemporanea, la importancia moderna, las tendencias actuales y como este tema se conecta con la vida en el Paris de hoy.",
  },
};

const AMSTERDAM_CITY = {
  id: "amsterdam",
  name: "Amsterdam",
  country: "the Netherlands",
  appName: "Amsterdam Stories",
  bundleId: "app.replit.amsterdamstories",
  contactEmail: "vragen@greenhome.nl",
  privacyPolicyDate: "2026-03-29",
  localizedNames: { en: "Amsterdam", nl: "Amsterdam", fr: "Amsterdam", de: "Amsterdam", es: "Ámsterdam" },
  localizedCountry: { en: "the Netherlands", nl: "Nederland", fr: "les Pays-Bas", de: "die Niederlande", es: "los Países Bajos" },
  topLevelName: { en: "Amsterdam Stories", nl: "Amsterdam Stories", fr: "Amsterdam Stories", de: "Amsterdam Stories", es: "Amsterdam Stories" },
  userLevels: [
    { id: "tourist", icon: "airplane", minPodcasts: 0, name: { en: "Tourist", nl: "Toerist", fr: "Touriste", de: "Tourist", es: "Turista" }, description: { en: "Just getting started exploring Amsterdam", nl: "Net begonnen met het verkennen van Amsterdam", fr: "Vous commencez à explorer Amsterdam", de: "Du fängst gerade an, Amsterdam zu erkunden", es: "Acabas de empezar a explorar Ámsterdam" } },
    { id: "explorer", icon: "compass", minPodcasts: 5, name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" }, description: { en: "Discovering the hidden stories of Amsterdam", nl: "De verborgen verhalen van Amsterdam ontdekken", fr: "À la découverte des histoires cachées d'Amsterdam", de: "Die verborgenen Geschichten von Amsterdam entdecken", es: "Descubriendo las historias ocultas de Ámsterdam" } },
    { id: "connoisseur", icon: "star", minPodcasts: 15, name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" }, description: { en: "A true connoisseur of Amsterdam culture", nl: "Een echte kenner van de Amsterdamse cultuur", fr: "Un vrai connaisseur de la culture amsterdamoise", de: "Ein wahrer Kenner der Amsterdamer Kultur", es: "Un verdadero conocedor de la cultura de Ámsterdam" } },
    { id: "world-explorer", icon: "earth", minPodcasts: 30, name: { en: "World Explorer", nl: "Wereldreiziger", fr: "Voyageur du Monde", de: "Weltentdecker", es: "Explorador del Mundo" }, description: { en: "A seasoned traveler with cities in your pocket", nl: "Een doorgewinterde reiziger met steden in je broekzak", fr: "Un voyageur aguerri avec les villes en poche", de: "Ein erfahrener Reisender mit Städten in der Tasche", es: "Un viajero experimentado con ciudades en el bolsillo" } },
  ],
  roleDescription: {
    nl: "Je bent een deskundige solo-podcastverteller. Je bent een ervaren gids die met de luisteraar door Amsterdam wandelt. Je vertelstijl is warm maar nuchter. Je deelt feiten en achtergronden op een toegankelijke, ontspannen manier. Je schrijft in vloeiend, natuurlijk Nederlands.",
    fr: "Vous etes un narrateur de podcast solo expert. Vous etes un guide experimente qui marche dans Amsterdam avec l'auditeur. Votre style est chaleureux mais ancre dans les faits. Vous partagez des faits et du contexte de maniere accessible et detendue. Vous ecrivez en francais fluide et naturel.",
    de: "Du bist ein sachkundiger Solo-Podcast-Erzaehler. Du bist ein erfahrener Guide, der mit dem Zuhoerer durch Amsterdam spaziert. Dein Stil ist warm, aber sachlich. Du teilst Fakten und Hintergruende auf zugaengliche, entspannte Weise. Du schreibst in fliessendem, natuerlichem Deutsch.",
    es: "Eres un narrador experto de podcast en solitario. Eres un guia experimentado que camina por Amsterdam con el oyente. Tu estilo es calido pero basado en hechos. Compartes datos y contexto de manera accesible y relajada. Escribes en espanol fluido y natural.",
    en: "You are a knowledgeable solo podcast storyteller. You are an experienced guide walking through Amsterdam with the listener. Your style is warm but grounded. You share facts and context in an accessible, relaxed way. You write in fluent, natural English.",
  },
  moderationPromptTemplate: `You are a content moderator for a city podcast app about {city}, {country}. Determine if the following topic is appropriate.\n\nALLOW topics that are: related to {city} or {country} in any way, including local streets, squares, neighborhoods, parks, landmarks, buildings, museums, restaurants, people, events, traditions, culture, history, architecture, food, nature, or daily life. Also allow general travel, culture, and lifestyle topics. Be GENEROUS — if a topic could reasonably be about {city} or {country}, allow it.\n\nREJECT ONLY topics that are: sexually explicit, promoting violence or hate, about illegal activities, about weapons or drugs.\n\nTopic: "{subject}"\n\nRespond with ONLY "ALLOW" or "REJECT".`,
  moderationRejectTemplate: "This topic is not suitable for {appName}. Please choose a topic related to {city}, its culture, history, or daily life.",
  walkingTourPerspective: {
    en: "Guide the listener as if walking through Amsterdam together. Describe what they would see, hear, and smell along the canals, over the bridges, and through the narrow streets. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.",
    nl: "Begeleid de luisteraar alsof je samen door Amsterdam wandelt. Beschrijf wat ze zouden zien, horen en ruiken langs de grachten, over de bruggen en door de smalle straatjes. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details.",
    fr: "Guidez l'auditeur comme si vous marchiez ensemble dans Amsterdam. Decrivez ce qu'il verrait, entendrait et sentirait le long des canaux, sur les ponts et dans les ruelles etroites. Emmenez-le aux meilleurs endroits et aux plus celebres du quartier. Utilisez un langage directionnel et des details sensoriels vivants.",
    de: "Fuehre den Zuhoerer, als wuerdet ihr gemeinsam durch Amsterdam spazieren. Beschreibe, was er entlang der Grachten, ueber die Bruecken und durch die engen Gassen sehen, hoeren und riechen wuerde. Nimm ihn mit zu den besten und beruehmtesten Orten der Gegend. Verwende Richtungsangaben und lebendige sensorische Details.",
    es: "Guia al oyente como si caminaran juntos por Amsterdam. Describe lo que veria, escucharia y oleria a lo largo de los canales, sobre los puentes y por las calles estrechas. Lleva al oyente a los mejores y mas famosos lugares de la zona. Usa lenguaje direccional y detalles sensoriales vividos.",
  },
  modernCulturePerspective: {
    en: "Focus on contemporary culture, modern-day significance, current trends, and how this topic connects to life in Amsterdam today. Consider Amsterdam's role as a progressive, creative city with a thriving arts and startup scene.",
    nl: "Focus op hedendaagse cultuur, de moderne betekenis, huidige trends en hoe dit onderwerp aansluit bij het leven in Amsterdam vandaag. Denk aan Amsterdams rol als progressieve, creatieve stad met een bloeiende kunst- en startupscene.",
    fr: "Concentrez-vous sur la culture contemporaine, la signification moderne, les tendances actuelles et comment ce sujet se connecte a la vie a Amsterdam aujourd'hui. Considerez le role d'Amsterdam en tant que ville progressive et creative.",
    de: "Konzentriere dich auf zeitgenoessische Kultur, moderne Bedeutung, aktuelle Trends und wie dieses Thema mit dem Leben im heutigen Amsterdam zusammenhaengt. Beruecksichtige Amsterdams Rolle als progressive, kreative Stadt.",
    es: "Concentrate en la cultura contemporanea, la importancia moderna, las tendencias actuales y como este tema se conecta con la vida en el Amsterdam de hoy. Considera el papel de Amsterdam como ciudad progresista y creativa.",
  },
};

const BARCELONA_CITY = {
  id: "barcelona",
  name: "Barcelona",
  country: "Spain",
  appName: "Barcelona Stories",
  bundleId: "app.replit.barcelonastories",
  contactEmail: "vragen@greenhome.nl",
  privacyPolicyDate: "2026-04-20",
  localizedNames: { en: "Barcelona", nl: "Barcelona", fr: "Barcelone", de: "Barcelona", es: "Barcelona" },
  localizedCountry: { en: "Spain", nl: "Spanje", fr: "l'Espagne", de: "Spanien", es: "España" },
  topLevelName: { en: "Barcelona Stories", nl: "Barcelona Stories", fr: "Barcelona Stories", de: "Barcelona Stories", es: "Barcelona Stories" },
  userLevels: [
    { id: "viajero", icon: "airplane", minPodcasts: 0, name: { en: "Traveler", nl: "Reiziger", fr: "Voyageur", de: "Reisender", es: "Viajero" }, description: { en: "Just getting started exploring Barcelona", nl: "Net begonnen met het verkennen van Barcelona", fr: "Vous commencez à explorer Barcelone", de: "Du fängst gerade an, Barcelona zu erkunden", es: "Acabas de empezar a explorar Barcelona" } },
    { id: "explorer", icon: "compass", minPodcasts: 5, name: { en: "Explorer", nl: "Ontdekker", fr: "Explorateur", de: "Entdecker", es: "Explorador" }, description: { en: "Discovering the hidden stories of Barcelona", nl: "De verborgen verhalen van Barcelona ontdekken", fr: "À la découverte des histoires cachées de Barcelone", de: "Die verborgenen Geschichten von Barcelona entdecken", es: "Descubriendo las historias ocultas de Barcelona" } },
    { id: "connoisseur", icon: "star", minPodcasts: 15, name: { en: "Connoisseur", nl: "Kenner", fr: "Connaisseur", de: "Kenner", es: "Conocedor" }, description: { en: "A true connoisseur of Catalan culture", nl: "Een echte kenner van de Catalaanse cultuur", fr: "Un vrai connaisseur de la culture catalane", de: "Ein wahrer Kenner der katalanischen Kultur", es: "Un verdadero conocedor de la cultura catalana" } },
    { id: "world-explorer", icon: "earth", minPodcasts: 30, name: { en: "World Explorer", nl: "Wereldreiziger", fr: "Voyageur du Monde", de: "Weltentdecker", es: "Explorador del Mundo" }, description: { en: "A seasoned traveler with cities in your pocket", nl: "Een doorgewinterde reiziger met steden in je broekzak", fr: "Un voyageur aguerri avec les villes en poche", de: "Ein erfahrener Reisender mit Städten in der Tasche", es: "Un viajero experimentado con ciudades en el bolsillo" } },
  ],
  roleDescription: {
    nl: "Je bent een deskundige solo-podcastverteller. Je bent een ervaren gids die met de luisteraar door Barcelona wandelt. Je vertelstijl is warm maar nuchter. Je deelt feiten en achtergronden op een toegankelijke, ontspannen manier. Je schrijft in vloeiend, natuurlijk Nederlands.",
    fr: "Vous etes un narrateur de podcast solo expert. Vous etes un guide experimente qui marche dans Barcelone avec l'auditeur. Votre style est chaleureux mais ancre dans les faits. Vous partagez des faits et du contexte de maniere accessible et detendue. Vous ecrivez en francais fluide et naturel.",
    de: "Du bist ein sachkundiger Solo-Podcast-Erzaehler. Du bist ein erfahrener Guide, der mit dem Zuhoerer durch Barcelona spaziert. Dein Stil ist warm, aber sachlich. Du teilst Fakten und Hintergruende auf zugaengliche, entspannte Weise. Du schreibst in fliessendem, natuerlichem Deutsch.",
    es: "Eres un narrador experto de podcast en solitario. Eres un guia experimentado que camina por Barcelona con el oyente. Tu estilo es calido pero basado en hechos. Compartes datos y contexto de manera accesible y relajada. Escribes en espanol fluido y natural.",
    en: "You are a knowledgeable solo podcast storyteller. You are an experienced guide walking through Barcelona with the listener. Your style is warm but grounded. You share facts and context in an accessible, relaxed way. You write in fluent, natural English.",
  },
  moderationPromptTemplate: `You are a content moderator for a city podcast app about {city}, {country}. Determine if the following topic is appropriate.\n\nALLOW topics that are: related to {city} or {country} in any way, including local streets, squares, neighborhoods, parks, landmarks, buildings, museums, restaurants, people, events, traditions, culture, history, architecture, food, nature, or daily life. Also allow general travel, culture, and lifestyle topics. Be GENEROUS — if a topic could reasonably be about {city} or {country}, allow it.\n\nREJECT ONLY topics that are: sexually explicit, promoting violence or hate, about illegal activities, about weapons or drugs.\n\nTopic: "{subject}"\n\nRespond with ONLY "ALLOW" or "REJECT".`,
  moderationRejectTemplate: "This topic is not suitable for {appName}. Please choose a topic related to {city}, its culture, history, or daily life.",
  walkingTourPerspective: {
    en: "Guide the listener as if walking through Barcelona together. Describe what they would see, hear, and smell along the boulevards, through the Gothic Quarter's narrow alleys, past Gaudí's curving facades, and along the Mediterranean. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.",
    nl: "Begeleid de luisteraar alsof je samen door Barcelona wandelt. Beschrijf wat ze zouden zien, horen en ruiken langs de boulevards, door de smalle straatjes van de Gotische Wijk, langs Gaudí's golvende gevels en aan de Middellandse Zee. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details.",
    fr: "Guidez l'auditeur comme si vous marchiez ensemble dans Barcelone. Decrivez ce qu'il verrait, entendrait et sentirait le long des boulevards, dans les ruelles du Quartier Gothique, devant les facades ondulantes de Gaudi et au bord de la Mediterranee. Emmenez-le aux meilleurs endroits et aux plus celebres du quartier. Utilisez un langage directionnel et des details sensoriels vivants.",
    de: "Fuehre den Zuhoerer, als wuerdet ihr gemeinsam durch Barcelona spazieren. Beschreibe, was er entlang der Boulevards, durch die engen Gassen des Gotischen Viertels, an Gaudis geschwungenen Fassaden vorbei und am Mittelmeer sehen, hoeren und riechen wuerde. Nimm ihn mit zu den besten und beruehmtesten Orten der Gegend. Verwende Richtungsangaben und lebendige sensorische Details.",
    es: "Guia al oyente como si caminaran juntos por Barcelona. Describe lo que veria, escucharia y oleria a lo largo de las ramblas, por las callejuelas del Barrio Gotico, frente a las fachadas onduladas de Gaudi y junto al Mediterraneo. Lleva al oyente a los mejores y mas famosos lugares de la zona. Usa lenguaje direccional y detalles sensoriales vividos.",
  },
  modernCulturePerspective: {
    en: "Focus on contemporary culture, modern-day significance, current trends, and how this topic connects to life in Barcelona today. Consider Barcelona's role as a Mediterranean creative capital with a vibrant Catalan identity, design scene, and innovative spirit.",
    nl: "Focus op hedendaagse cultuur, de moderne betekenis, huidige trends en hoe dit onderwerp aansluit bij het leven in Barcelona vandaag. Denk aan Barcelona's rol als mediterrane creatieve hoofdstad met een levendige Catalaanse identiteit, designscene en innovatieve geest.",
    fr: "Concentrez-vous sur la culture contemporaine, la signification moderne, les tendances actuelles et comment ce sujet se connecte a la vie a Barcelone aujourd'hui. Considerez le role de Barcelone comme capitale creative mediterraneenne avec une identite catalane vibrante.",
    de: "Konzentriere dich auf zeitgenoessische Kultur, moderne Bedeutung, aktuelle Trends und wie dieses Thema mit dem Leben im heutigen Barcelona zusammenhaengt. Beruecksichtige Barcelonas Rolle als mediterrane Kreativhauptstadt mit lebendiger katalanischer Identitaet.",
    es: "Concentrate en la cultura contemporanea, la importancia moderna, las tendencias actuales y como este tema se conecta con la vida en la Barcelona de hoy. Considera el papel de Barcelona como capital creativa mediterranea con una vibrante identidad catalana.",
  },
  thankYouWord: "Gràcies!",
  cityHighlights: { en: "Modernisme", nl: "het Modernisme", fr: "le Modernisme", de: "den Modernismus", es: "el Modernismo" },
  topicThemeMap: {
    "bcn-roman-barcino": "history", "bcn-counts": "history", "bcn-aragon": "history", "bcn-1714": "history", "bcn-renaixenca": "history", "bcn-1888": "history", "bcn-civil-war": "history", "bcn-franco": "history",
    "bcn-sagrada": "gaudi", "bcn-park-guell": "gaudi", "bcn-casa-batllo": "gaudi", "bcn-pedrera": "gaudi", "bcn-gaudi-life": "gaudi", "bcn-domenech": "gaudi", "bcn-trencadis": "gaudi", "bcn-eixample": "gaudi",
    "bcn-picasso-museum": "museums", "bcn-mnac": "museums", "bcn-miro": "museums", "bcn-macba": "museums", "bcn-history-museum": "museums", "bcn-cccb": "museums", "bcn-maritime": "museums", "bcn-cosmo": "museums",
    "bcn-cathedral": "epic-buildings", "bcn-santa-maria": "epic-buildings", "bcn-palau-musica": "epic-buildings", "bcn-arc-triomf": "epic-buildings", "bcn-camp-nou": "epic-buildings", "bcn-torre-agbar": "epic-buildings", "bcn-montjuic-castle": "epic-buildings", "bcn-columbus": "epic-buildings",
    "bcn-fcb-cruyff": "modern-history", "bcn-transition": "modern-history", "bcn-independentism": "modern-history", "bcn-22at": "modern-history", "bcn-overtourism": "modern-history", "bcn-superblocks": "modern-history", "bcn-rumba": "modern-history", "bcn-castellers": "modern-history",
    "bcn-gothic-quarter": "neighborhoods", "bcn-born": "neighborhoods", "bcn-raval": "neighborhoods", "bcn-gracia": "neighborhoods", "bcn-barceloneta": "neighborhoods", "bcn-poble-sec": "neighborhoods", "bcn-poblenou": "neighborhoods", "bcn-sant-antoni": "neighborhoods",
    "bcn-tapas": "culinary", "bcn-pa-amb-tomaquet": "culinary", "bcn-vermut": "culinary", "bcn-boqueria": "culinary", "bcn-seafood-mar": "culinary", "bcn-cava": "culinary", "bcn-crema-catalana": "culinary", "bcn-elbulli": "culinary",
  },
  themeAngles: {
    "history": [
      { id: "historical", names: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" }, descriptions: { en: "Facts, dates, and chronological storytelling", nl: "Feiten, data en chronologisch vertellen", fr: "Faits, dates et récit chronologique", de: "Fakten, Daten und chronologisches Erzählen", es: "Hechos, fechas y narración cronológica" } },
      { id: "personal-stories", names: { en: "Personal Stories", nl: "Persoonlijke Verhalen", fr: "Histoires personnelles", de: "Persönliche Geschichten", es: "Historias personales" }, descriptions: { en: "The story told from the iconic figures involved", nl: "Het verhaal verteld vanuit de iconische figuren", fr: "L'histoire racontée du point de vue des personnages emblématiques", de: "Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren", es: "La historia contada desde las figuras icónicas involucradas" } },
    ],
    "gaudi": [
      { id: "architecture", names: { en: "Architecture & Building", nl: "Architectuur & Gebouw", fr: "Architecture & Bâtiment", de: "Architektur & Gebäude", es: "Arquitectura & Edificio" }, descriptions: { en: "The architectural story and design of the building itself", nl: "Het architectuurverhaal en het ontwerp van het gebouw zelf", fr: "L'histoire architecturale et le design du bâtiment lui-même", de: "Die architektonische Geschichte und Gestaltung des Gebäudes selbst", es: "La historia arquitectónica y el diseño del edificio en sí" } },
      { id: "personal-stories", names: { en: "Personal Stories", nl: "Persoonlijke Verhalen", fr: "Histoires personnelles", de: "Persönliche Geschichten", es: "Historias personales" }, descriptions: { en: "The story told from the iconic figures involved", nl: "Het verhaal verteld vanuit de iconische figuren", fr: "L'histoire racontée du point de vue des personnages emblématiques", de: "Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren", es: "La historia contada desde las figuras icónicas involucradas" } },
      { id: "walking-tour", names: { en: "Walking Tour", nl: "Wandeltour", fr: "Visite à pied", de: "Rundgang", es: "Paseo guiado" }, descriptions: { en: "A guided walk past the best and most famous places in the area", nl: "Een begeleide wandeling langs de beste en beroemdste plekken", fr: "Une promenade guidée devant les meilleurs endroits du quartier", de: "Ein geführter Spaziergang an den besten und berühmtesten Orten", es: "Un paseo guiado por los mejores y más famosos lugares de la zona" } },
    ],
    "museums": [
      { id: "origin", names: { en: "Origin of the Museum", nl: "Ontstaan van het Museum", fr: "Origine du Musée", de: "Ursprung des Museums", es: "Origen del Museo" }, descriptions: { en: "The founding story and how the museum came to be", nl: "Het ontstaansverhaal en hoe het museum tot stand kwam", fr: "L'histoire de sa fondation et comment le musée est né", de: "Die Gründungsgeschichte und wie das Museum entstand", es: "La historia de su fundación y cómo nació el museo" } },
      { id: "prominent-art", names: { en: "Prominent Art Pieces", nl: "Prominente Kunstwerken", fr: "Œuvres d'art emblématiques", de: "Bedeutende Kunstwerke", es: "Obras de arte destacadas" }, descriptions: { en: "The most famous and significant works in the collection", nl: "De beroemdste en belangrijkste werken in de collectie", fr: "Les œuvres les plus célèbres et les plus importantes de la collection", de: "Die berühmtesten und bedeutendsten Werke der Sammlung", es: "Las obras más famosas e importantes de la colección" } },
      { id: "architecture", names: { en: "Architecture & Building", nl: "Architectuur & Gebouw", fr: "Architecture & Bâtiment", de: "Architektur & Gebäude", es: "Arquitectura & Edificio" }, descriptions: { en: "The architectural story and design of the building itself", nl: "Het architectuurverhaal en het ontwerp van het gebouw zelf", fr: "L'histoire architecturale et le design du bâtiment lui-même", de: "Die architektonische Geschichte und Gestaltung des Gebäudes selbst", es: "La historia arquitectónica y el diseño del edificio en sí" } },
    ],
    "epic-buildings": [
      { id: "architecture", names: { en: "Architecture & Building", nl: "Architectuur & Gebouw", fr: "Architecture & Bâtiment", de: "Architektur & Gebäude", es: "Arquitectura & Edificio" }, descriptions: { en: "The architectural story and design of the building itself", nl: "Het architectuurverhaal en het ontwerp van het gebouw zelf", fr: "L'histoire architecturale et le design du bâtiment lui-même", de: "Die architektonische Geschichte und Gestaltung des Gebäudes selbst", es: "La historia arquitectónica y el diseño del edificio en sí" } },
      { id: "historical", names: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" }, descriptions: { en: "Facts, dates, and chronological storytelling", nl: "Feiten, data en chronologisch vertellen", fr: "Faits, dates et récit chronologique", de: "Fakten, Daten und chronologisches Erzählen", es: "Hechos, fechas y narración cronológica" } },
      { id: "walking-tour", names: { en: "Walking Tour", nl: "Wandeltour", fr: "Visite à pied", de: "Rundgang", es: "Paseo guiado" }, descriptions: { en: "A guided walk past the best and most famous places in the area", nl: "Een begeleide wandeling langs de beste en beroemdste plekken", fr: "Une promenade guidée devant les meilleurs endroits du quartier", de: "Ein geführter Spaziergang an den besten und berühmtesten Orten", es: "Un paseo guiado por los mejores y más famosos lugares de la zona" } },
    ],
    "modern-history": [
      { id: "historical", names: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" }, descriptions: { en: "Facts, dates, and chronological storytelling", nl: "Feiten, data en chronologisch vertellen", fr: "Faits, dates et récit chronologique", de: "Fakten, Daten und chronologisches Erzählen", es: "Hechos, fechas y narración cronológica" } },
      { id: "cultural", names: { en: "Cultural", nl: "Cultureel", fr: "Culturel", de: "Kulturell", es: "Cultural" }, descriptions: { en: "Art, food, lifestyle, and cultural significance", nl: "Kunst, eten, levensstijl en culturele betekenis", fr: "Art, gastronomie, mode de vie et importance culturelle", de: "Kunst, Essen, Lebensstil und kulturelle Bedeutung", es: "Arte, gastronomía, estilo de vida e importancia cultural" } },
      { id: "modern-times", names: { en: "Modern Times", nl: "Moderne Tijd", fr: "Époque moderne", de: "Moderne Zeit", es: "Tiempos modernos" }, descriptions: { en: "What this topic looks like today and how it has evolved", nl: "Hoe dit onderwerp er vandaag uitziet en hoe het is geëvolueerd", fr: "À quoi ressemble ce sujet aujourd'hui et comment il a évolué", de: "Wie dieses Thema heute aussieht und wie es sich entwickelt hat", es: "Cómo se ve este tema hoy y cómo ha evolucionado" } },
    ],
    "neighborhoods": [
      { id: "historical", names: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" }, descriptions: { en: "The origins and historical evolution of this neighborhood", nl: "De oorsprong en historische ontwikkeling van deze buurt", fr: "Les origines et l'évolution historique de ce quartier", de: "Die Ursprünge und die historische Entwicklung dieses Viertels", es: "Los orígenes y la evolución histórica de este barrio" } },
      { id: "cultural", names: { en: "Cultural", nl: "Cultureel", fr: "Culturel", de: "Kulturell", es: "Cultural" }, descriptions: { en: "Art, food, lifestyle, and cultural significance", nl: "Kunst, eten, levensstijl en culturele betekenis", fr: "Art, gastronomie, mode de vie et importance culturelle", de: "Kunst, Essen, Lebensstil und kulturelle Bedeutung", es: "Arte, gastronomía, estilo de vida e importancia cultural" } },
      { id: "modern-times", names: { en: "Modern Times", nl: "Moderne Tijd", fr: "Époque moderne", de: "Moderne Zeit", es: "Tiempos modernos" }, descriptions: { en: "What the neighborhood looks like today and how it has evolved", nl: "Hoe de buurt er vandaag uitziet en hoe deze is geëvolueerd", fr: "À quoi ressemble le quartier aujourd'hui et comment il a évolué", de: "Wie das Viertel heute aussieht und wie es sich entwickelt hat", es: "Cómo se ve el barrio hoy y cómo ha evolucionado" } },
      { id: "walking-tour", names: { en: "Walking Tour", nl: "Wandeltour", fr: "Visite à pied", de: "Rundgang", es: "Paseo guiado" }, descriptions: { en: "A guided walk past the best and most famous places in the area", nl: "Een begeleide wandeling langs de beste en beroemdste plekken", fr: "Une promenade guidée devant les meilleurs endroits du quartier", de: "Ein geführter Spaziergang an den besten und berühmtesten Orten", es: "Un paseo guiado por los mejores y más famosos lugares de la zona" } },
    ],
    "culinary": [
      { id: "cultural", names: { en: "Cultural", nl: "Cultureel", fr: "Culturel", de: "Kulturell", es: "Cultural" }, descriptions: { en: "How this dish or drink fits into Catalan culture and daily life", nl: "Hoe dit gerecht of deze drank past in de Catalaanse cultuur en het dagelijks leven", fr: "Comment ce plat ou cette boisson s'inscrit dans la culture catalane et la vie quotidienne", de: "Wie dieses Gericht oder Getränk zur katalanischen Kultur und zum Alltag gehört", es: "Cómo este plato o bebida encaja en la cultura catalana y la vida diaria" } },
      { id: "historical", names: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" }, descriptions: { en: "The origins and historical evolution of this culinary tradition", nl: "De oorsprong en historische ontwikkeling van deze culinaire traditie", fr: "Les origines et l'évolution historique de cette tradition culinaire", de: "Die Ursprünge und historische Entwicklung dieser kulinarischen Tradition", es: "Los orígenes y la evolución histórica de esta tradición culinaria" } },
      { id: "modern-times", names: { en: "Modern Times", nl: "Moderne Tijd", fr: "Époque moderne", de: "Moderne Zeit", es: "Tiempos modernos" }, descriptions: { en: "How this tradition is enjoyed in Barcelona today", nl: "Hoe deze traditie vandaag in Barcelona wordt beleefd", fr: "Comment cette tradition se vit à Barcelone aujourd'hui", de: "Wie diese Tradition heute in Barcelona gelebt wird", es: "Cómo se vive esta tradición en la Barcelona de hoy" } },
    ],
  },
};

export async function seedCitiesIfEmpty(): Promise<void> {
  try {
    const [{ value: cityCount }] = await db.select({ value: count() }).from(cities);
    if (cityCount > 0) {
      console.log(`[Seed] Cities table has ${cityCount} rows, ensuring all cities exist...`);
      await db.insert(cities).values([PARIS_CITY, AMSTERDAM_CITY, BARCELONA_CITY]).onConflictDoNothing();
      return;
    }

    console.log("[Seed] Cities table is empty, seeding Paris, Amsterdam, and Barcelona...");
    await db.insert(cities).values([PARIS_CITY, AMSTERDAM_CITY, BARCELONA_CITY]).onConflictDoNothing();
    console.log("[Seed] Cities seeded successfully.");
  } catch (err) {
    console.error("[Seed] Failed to seed cities:", err);
  }
}
