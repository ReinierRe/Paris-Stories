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
    { id: "parisien", icon: "crown", minPodcasts: 15, name: { en: "Parisien", nl: "Parisien", fr: "Parisien", de: "Parisien", es: "Parisien" }, description: { en: "You know Paris like the back of your hand", nl: "Je kent Parijs als je broekzak", fr: "Vous connaissez Paris comme votre poche", de: "Du kennst Paris wie deine Westentasche", es: "Conoces París como la palma de tu mano" } },
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
    { id: "amsterdammer", icon: "crown", minPodcasts: 30, name: { en: "Amsterdammer", nl: "Amsterdammer", fr: "Amsterdammois", de: "Amsterdammer", es: "Amsterdammer" }, description: { en: "You know Amsterdam like a true local", nl: "Je kent Amsterdam als een echte Amsterdammer", fr: "Vous connaissez Amsterdam comme un vrai local", de: "Du kennst Amsterdam wie ein wahrer Einheimischer", es: "Conoces Ámsterdam como un verdadero local" } },
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

export async function seedCitiesIfEmpty(): Promise<void> {
  try {
    const [{ value: cityCount }] = await db.select({ value: count() }).from(cities);
    if (cityCount > 0) {
      console.log(`[Seed] Cities table has ${cityCount} rows, skipping seed.`);
      return;
    }

    console.log("[Seed] Cities table is empty, seeding Paris and Amsterdam...");
    await db.insert(cities).values([PARIS_CITY, AMSTERDAM_CITY]).onConflictDoNothing();
    console.log("[Seed] Cities seeded successfully.");
  } catch (err) {
    console.error("[Seed] Failed to seed cities:", err);
  }
}
