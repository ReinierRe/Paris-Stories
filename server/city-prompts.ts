import type { City } from "@shared/schema";

export function getCityName(city: City, lang: string): string {
  const names = city.localizedNames as Record<string, string>;
  return names[lang] || city.name;
}

export function getCountryName(city: City, lang: string): string {
  const countries = city.localizedCountry as Record<string, string>;
  return countries[lang] || city.country;
}

export function getRoleDescription(city: City, lang: string): Record<string, string> {
  if (city.roleDescription) {
    return city.roleDescription as Record<string, string>;
  }
  const c = getCityName(city, lang);
  return {
    nl: `Je bent een deskundige solo-podcastverteller. Je bent een ervaren gids die met de luisteraar door ${c} wandelt. Je vertelstijl is warm maar nuchter. Je deelt feiten en achtergronden op een toegankelijke, ontspannen manier. Je schrijft in vloeiend, natuurlijk Nederlands.`,
    fr: `Vous etes un narrateur de podcast solo expert. Vous etes un guide experimente qui marche dans ${c} avec l'auditeur. Votre style est chaleureux mais ancre dans les faits. Vous partagez des faits et du contexte de maniere accessible et detendue. Vous ecrivez en francais fluide et naturel.`,
    de: `Du bist ein sachkundiger Solo-Podcast-Erzaehler. Du bist ein erfahrener Guide, der mit dem Zuhoerer durch ${c} spaziert. Dein Stil ist warm, aber sachlich. Du teilst Fakten und Hintergruende auf zugaengliche, entspannte Weise. Du schreibst in fliessendem, natuerlichem Deutsch.`,
    es: `Eres un narrador experto de podcast en solitario. Eres un guia experimentado que camina por ${c} con el oyente. Tu estilo es calido pero basado en hechos. Compartes datos y contexto de manera accesible y relajada. Escribes en espanol fluido y natural.`,
    en: `You are a knowledgeable solo podcast storyteller. You are an experienced guide walking through ${c} with the listener. Your style is warm but grounded. You share facts and context in an accessible, relaxed way. You write in fluent, natural English.`,
  };
}

export function getCuratedUserPrompt(city: City, lang: string, topicName: string, themeName: string): string {
  const c = getCityName(city, lang);
  const country = getCountryName(city, lang);
  if (lang === "nl") {
    return `Schrijf een podcast over: ${topicName} in ${c}, ${country} (thema: ${themeName}). Dit gaat UITSLUITEND over ${c}, NIET over een andere stad.`;
  }
  const cEn = getCityName(city, "en");
  const countryEn = getCountryName(city, "en");
  return `Write a podcast about: ${topicName} in ${cEn}, ${countryEn} (theme: ${themeName}). This is EXCLUSIVELY about ${cEn}, NOT about any other city.`;
}

export function getCustomUserPrompts(city: City, lang: string, subject: string): Record<string, string> {
  const names = city.localizedNames as Record<string, string>;
  const countries = city.localizedCountry as Record<string, string>;
  return {
    nl: `Schrijf een podcast over: ${subject} in ${names.nl || city.name}, ${countries.nl || city.country}. Dit gaat UITSLUITEND over ${names.nl || city.name}, NIET over een andere stad.`,
    fr: `Ecrivez un podcast sur: ${subject} a ${names.fr || city.name}, ${countries.fr || city.country}. Ceci concerne EXCLUSIVEMENT ${names.fr || city.name}, PAS une autre ville.`,
    de: `Schreibe einen Podcast ueber: ${subject} in ${names.de || city.name}, ${countries.de || city.country}. Dies handelt AUSSCHLIESSLICH von ${names.de || city.name}, NICHT von einer anderen Stadt.`,
    es: `Escribe un podcast sobre: ${subject} en ${names.es || city.name}, ${countries.es || city.country}. Esto es EXCLUSIVAMENTE sobre ${names.es || city.name}, NO sobre otra ciudad.`,
    en: `Write a podcast about: ${subject} in ${names.en || city.name}, ${countries.en || city.country}. This is EXCLUSIVELY about ${names.en || city.name}, NOT about any other city.`,
  };
}

export function getModerationPrompt(city: City, subject: string): string {
  if (city.moderationPromptTemplate) {
    return city.moderationPromptTemplate
      .replace(/\{city\}/g, city.name)
      .replace(/\{country\}/g, city.country)
      .replace(/\{subject\}/g, subject);
  }
  return `You are a content moderator for a city podcast app about ${city.name}, ${city.country}. Determine if the following topic is appropriate.\n\nALLOW topics that are: related to ${city.name} or ${city.country} in any way, including local streets, squares, neighborhoods, parks, landmarks, buildings, museums, restaurants, people, events, traditions, culture, history, architecture, food, nature, or daily life. Also allow general travel, culture, and lifestyle topics. Be GENEROUS — if a topic could reasonably be about ${city.name} or ${city.country}, allow it.\n\nREJECT ONLY topics that are: sexually explicit, promoting violence or hate, about illegal activities, about weapons or drugs.\n\nTopic: "${subject}"\n\nRespond with ONLY "ALLOW" or "REJECT".`;
}

export function getModerationRejectMessage(city: City): string {
  if (city.moderationRejectTemplate) {
    return city.moderationRejectTemplate
      .replace(/\{appName\}/g, city.appName)
      .replace(/\{city\}/g, city.name);
  }
  return `This topic is not suitable for ${city.appName}. Please choose a topic related to ${city.name}, its culture, history, or daily life.`;
}

export function getCustomAnglePerspectives(city: City): Record<string, Record<string, string>> {
  const perspective = city.modernCulturePerspective as Record<string, string> | null;
  if (perspective) {
    return { "modern-culture": perspective };
  }
  const names = city.localizedNames as Record<string, string>;
  return {
    "modern-culture": {
      en: `Focus on contemporary culture, modern-day significance, current trends, and how this topic connects to life in ${names.en} today.`,
      nl: `Focus op hedendaagse cultuur, de moderne betekenis, huidige trends en hoe dit onderwerp aansluit bij het leven in ${names.nl} vandaag.`,
      fr: `Concentrez-vous sur la culture contemporaine, la signification moderne, les tendances actuelles et comment ce sujet se connecte a la vie a ${names.fr} aujourd'hui.`,
      de: `Konzentriere dich auf zeitgenoessische Kultur, moderne Bedeutung, aktuelle Trends und wie dieses Thema mit dem Leben im heutigen ${names.de} zusammenhaengt.`,
      es: `Concentrate en la cultura contemporanea, la importancia moderna, las tendencias actuales y como este tema se conecta con la vida en el ${names.es} de hoy.`,
    },
  };
}

export function getWalkingTourPerspective(city: City): Record<string, string> {
  if (city.walkingTourPerspective) {
    return city.walkingTourPerspective as Record<string, string>;
  }
  const names = city.localizedNames as Record<string, string>;
  return {
    en: `Guide the listener as if walking through ${names.en} together. Describe what they would see, hear, and smell. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.`,
    nl: `Begeleid de luisteraar alsof je samen door ${names.nl} wandelt. Beschrijf wat ze zouden zien, horen en ruiken. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details.`,
    fr: `Guidez l'auditeur comme si vous marchiez ensemble dans ${names.fr}. Decrivez ce qu'il verrait, entendrait et sentirait. Emmenez-le aux meilleurs endroits et aux plus celebres du quartier. Utilisez un langage directionnel et des details sensoriels vivants.`,
    de: `Fuehre den Zuhoerer, als wuerdet ihr gemeinsam durch ${names.de} spazieren. Beschreibe, was er sehen, hoeren und riechen wuerde. Nimm ihn mit zu den besten und beruehmtesten Orten der Gegend. Verwende Richtungsangaben und lebendige sensorische Details.`,
    es: `Guia al oyente como si caminaran juntos por ${names.es}. Describe lo que veria, escucharia y oleria. Lleva al oyente a los mejores y mas famosos lugares de la zona. Usa lenguaje direccional y detalles sensoriales vividos.`,
  };
}

export function getPrivacyPolicyHtml(city: City): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy - City Stories</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F8F6F1; color: #1A1A2E; line-height: 1.7; padding: 20px; }
  .container { max-width: 680px; margin: 0 auto; padding: 40px 20px; }
  h1 { font-size: 28px; margin-bottom: 8px; color: #1A1A2E; }
  .date { color: #888; font-size: 14px; margin-bottom: 32px; }
  h2 { font-size: 20px; margin-top: 28px; margin-bottom: 12px; color: #1A1A2E; }
  p, li { font-size: 15px; margin-bottom: 12px; }
  ul { padding-left: 20px; }
  a { color: #C4A265; }
</style>
</head>
<body>
<div class="container">
<h1>Privacy Policy — City Stories</h1>
<p class="date">Last updated: ${city.privacyPolicyDate}</p>

<p>City Stories ("we", "our") is committed to protecting your privacy. City Stories is a single app that includes content for multiple cities (currently Amsterdam, Paris, and Barcelona). This document explains what data we collect, how we use it, and your rights.</p>

<h2>1. Data We Collect</h2>
<ul>
<li><strong>Account information:</strong> When you create an account, we collect your email address and first name.</li>
<li><strong>Podcast data:</strong> We store the podcasts you create and listen to, including custom topics you enter.</li>
<li><strong>Usage data:</strong> Basic usage information such as which features you use, to improve the app.</li>
</ul>

<h2>2. How We Use Your Data</h2>
<ul>
<li>To provide and improve our podcast generation service.</li>
<li>To save your podcast library across devices.</li>
<li>To authenticate your account securely via Firebase Authentication.</li>
</ul>

<h2>3. AI-Generated Content</h2>
<p>City Stories apps use artificial intelligence to create podcast scripts. When you request a podcast, your chosen topic is sent to <strong>Anthropic Claude</strong>, a third-party AI service, which generates the script. The generated script is then converted to audio using <strong>Google Cloud Text-to-Speech</strong>.</p>
<p>Your topic input is processed by these AI services solely for the purpose of generating your podcast. We do not use your input to train AI models. Anthropic and Google process this data according to their own privacy policies.</p>

<h2>4. Third-Party Services</h2>
<p>We use the following third-party services:</p>
<ul>
<li><strong>Firebase Authentication</strong> (Google) for secure account management.</li>
<li><strong>Anthropic Claude</strong> (Anthropic) for AI-powered script generation. Your podcast topic is sent to this service.</li>
<li><strong>Google Cloud Text-to-Speech</strong> (Google) for converting scripts to spoken audio.</li>
</ul>
<p>These services have their own privacy policies. We do not sell your data to third parties.</p>

<h2>5. Data Storage</h2>
<p>Your data is stored securely on our servers. Audio files are stored in cloud object storage. We retain your data as long as your account is active.</p>

<h2>6. Your Rights</h2>
<ul>
<li><strong>Delete your account:</strong> You can delete your account and all associated data at any time from the Profile screen in the app.</li>
<li><strong>Access your data:</strong> You can view all your podcasts and account information within the app.</li>
<li><strong>Contact us:</strong> For any privacy-related questions, contact us at ${city.contactEmail}.</li>
</ul>

<h2>7. Children's Privacy</h2>
<p>City Stories apps are not intended for children under 13. We do not knowingly collect data from children.</p>

<h2>8. Changes to This Policy</h2>
<p>We may update this policy from time to time. We will notify users of significant changes through the app.</p>
</div>
</body>
</html>`;
}
