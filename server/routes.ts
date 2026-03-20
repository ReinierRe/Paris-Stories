import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { textToSpeech } from "./tts";
import { getGoogleVoiceType, type VoiceType } from "./google-tts";
import { requireAuth } from "./auth";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { eq, and, count } from "drizzle-orm";
import { db } from "./storage";
import { cachedPodcasts, customPodcasts, userPodcasts } from "@shared/schema";
import { desc } from "drizzle-orm";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL!,
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

const AUDIO_DIR = path.resolve(process.cwd(), "podcast-audio");
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function getAudioBucketName(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  }
  return bucketId;
}

async function uploadAudioToStorage(filename: string, audioBuffer: Buffer): Promise<void> {
  const bucketName = getAudioBucketName();
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(`podcast-audio/${filename}`);
  await file.save(audioBuffer, {
    contentType: "audio/wav",
    resumable: false,
  });
  console.log(`Uploaded ${filename} to Object Storage`);
}

async function audioExistsInStorage(filename: string): Promise<boolean> {
  try {
    const bucketName = getAudioBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(`podcast-audio/${filename}`);
    const [exists] = await file.exists();
    return exists;
  } catch {
    return false;
  }
}

async function deleteAudioFromStorage(filename: string): Promise<void> {
  try {
    const bucketName = getAudioBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(`podcast-audio/${filename}`);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`Deleted ${filename} from Object Storage`);
    }
  } catch (err) {
    console.error(`Failed to delete ${filename} from Object Storage:`, err);
  }
}

async function streamAudioFromStorage(filename: string, res: Response): Promise<boolean> {
  try {
    const bucketName = getAudioBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(`podcast-audio/${filename}`);
    const [exists] = await file.exists();
    if (!exists) return false;

    const [metadata] = await file.getMetadata();
    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": String(metadata.size || 0),
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes",
    });

    const stream = file.createReadStream();
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming audio" });
      }
    });
    stream.pipe(res);
    return true;
  } catch {
    return false;
  }
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface GenerationJob {
  status: "generating" | "ready" | "error";
  progress?: string;
  result?: {
    id: string;
    title?: string;
    script: string;
    audioUrl: string;
    durationSeconds: number;
    cached: boolean;
    subject?: string;
    angle?: string;
    voice?: string;
    language?: string;
    length?: string;
    createdAt?: string;
    customDbId?: string;
  };
  error?: string;
  createdAt: number;
}

const generationJobs = new Map<string, GenerationJob>();

setInterval(() => {
  const now = Date.now();
  for (const [id, job] of generationJobs) {
    if (now - job.createdAt > 30 * 60 * 1000) {
      generationJobs.delete(id);
    }
  }
}, 10 * 60 * 1000);


function getChirp3Instructions(language: string): string {
  const instructions: Record<string, string> = {
    nl: `

## Schrijfstijl voor spraak (VERPLICHT)
De audio wordt gegenereerd met Google Chirp 3: HD. Schrijf in platte tekst, geen opmaak.

Regels:
1. **Platte tekst:** Schrijf gewone tekst. Gebruik GEEN SSML-tags (\`<speak>\`, \`<break>\`, \`<prosody>\`), GEEN pauze-markers (\`[pause short]\`, \`[pause long]\`), en GEEN emotionele cues (\`[fluisterend]\` etc.).
2. **Geen afkortingen:** Schrijf altijd voluit. Gebruik "het" in plaats van "'t", "er" in plaats van "d'r", "mijn" in plaats van "m'n", "een" in plaats van "'n". Geen samentrekkingen.
3. **Geen stopwoordjes:** Vermijd woorden als "Tja,", "Hè,", "Kijk,", "Hoor je dat?", "Weet je wat?", "Echt waar,". Vertel gewoon het verhaal zonder dit soort vulwoorden.
4. **Geen streepjes of drie puntjes:** Gebruik GEEN liggende streepjes (—), GEEN drie puntjes (...). Gebruik gewone komma's en punten voor ritme en pauzes.
5. **Fonetisch helder:** Schrijf woorden die goed uitspreekbaar zijn voor text-to-speech. Vermijd moeilijke woordcombinaties, tongbrekers en ongebruikelijke leenwoorden. Gebruik eenvoudige, heldere Nederlandse woorden.

BELANGRIJK:
- Schrijf in platte tekst, GEEN SSML-tags, GEEN markers tussen haken.
- Gebruik GEEN markdown-opmaak of koppen.`,

    fr: `

## Style d'ecriture pour la parole (OBLIGATOIRE)
L'audio sera genere avec Google Chirp 3: HD. Ecrivez en texte brut, sans mise en forme.

Regles:
1. **Texte brut:** Ecrivez du texte ordinaire. N'utilisez PAS de balises SSML (\`<speak>\`, \`<break>\`, \`<prosody>\`), PAS de marqueurs de pause (\`[pause short]\`, \`[pause long]\`), et PAS de cues emotionnels (\`[chuchotant]\` etc.).
2. **Pas d'abreviations:** Ecrivez les mots en entier. Pas de contractions familieres.
3. **Pas de mots de remplissage:** Evitez les mots comme "Bon,", "Alors,", "Ecoutez,", "Vous savez,". Racontez simplement l'histoire.
4. **Pas de tirets ou points de suspension:** N'utilisez PAS de tirets longs, de tirets courts ou de points de suspension. Utilisez des virgules et des points.
5. **Phonetiquement clair:** Ecrivez des mots faciles a prononcer pour la synthese vocale. Evitez les combinaisons de mots difficiles.

IMPORTANT:
- Ecrivez en texte brut, PAS de balises SSML, PAS de marqueurs entre crochets.
- N'utilisez PAS de mise en forme markdown ou de titres.`,

    de: `

## Schreibstil fuer Sprache (PFLICHT)
Das Audio wird mit Google Chirp 3: HD generiert. Schreibe in reinem Text, keine Formatierung.

Regeln:
1. **Reiner Text:** Schreibe normalen Text. Verwende KEINE SSML-Tags (\`<speak>\`, \`<break>\`, \`<prosody>\`), KEINE Pausen-Marker (\`[pause short]\`, \`[pause long]\`), und KEINE emotionalen Hinweise (\`[fluestern]\` etc.).
2. **Keine Abkuerzungen:** Schreibe Woerter vollstaendig aus. Keine umgangssprachlichen Verkuerzungen.
3. **Keine Fuellwoerter:** Vermeide Woerter wie "Nun ja,", "Schau mal,", "Weisst du,". Erzaehle einfach die Geschichte.
4. **Keine Gedankenstriche oder Auslassungspunkte:** Verwende KEINE Gedankenstriche oder Auslassungspunkte. Verwende Kommas und Punkte.
5. **Phonetisch klar:** Schreibe Woerter, die fuer die Sprachsynthese leicht auszusprechen sind. Vermeide schwierige Wortkombinationen.

WICHTIG:
- Schreibe in reinem Text, KEINE SSML-Tags, KEINE Marker in Klammern.
- Verwende KEINE Markdown-Formatierung oder Ueberschriften.`,

    es: `

## Estilo de escritura para voz (OBLIGATORIO)
El audio se generara con Google Chirp 3: HD. Escribe en texto plano, sin formato.

Reglas:
1. **Texto plano:** Escribe texto ordinario. NO uses etiquetas SSML (\`<speak>\`, \`<break>\`, \`<prosody>\`), NO uses marcadores de pausa (\`[pause short]\`, \`[pause long]\`), ni indicaciones emocionales (\`[susurrando]\` etc.).
2. **Sin abreviaturas:** Escribe las palabras completas. Sin contracciones coloquiales.
3. **Sin palabras de relleno:** Evita palabras como "Bueno,", "Mira,", "Sabes,", "La verdad,". Simplemente cuenta la historia.
4. **Sin guiones o puntos suspensivos:** NO uses guiones largos, guiones cortos o puntos suspensivos. Usa comas y puntos.
5. **Foneticamente claro:** Escribe palabras faciles de pronunciar para la sintesis de voz. Evita combinaciones de palabras dificiles.

IMPORTANTE:
- Escribe en texto plano, SIN etiquetas SSML, SIN marcadores entre corchetes.
- NO uses formato markdown o encabezados.`,
  };

  return instructions[language] || `

## Writing Style for Speech (MANDATORY)
The audio will be generated with Google Chirp 3: HD. Write in plain text, no formatting.

Rules:
1. **Plain text:** Write ordinary text. Do NOT use SSML tags (\`<speak>\`, \`<break>\`, \`<prosody>\`), NO pause markers (\`[pause short]\`, \`[pause long]\`), and NO emotional cues (\`[whispering]\` etc.).
2. **No abbreviations:** Write words out in full. Use "it is" instead of "it's", "they would" instead of "they'd", "do not" instead of "don't". No contractions.
3. **No filler words:** Avoid words like "Well,", "Look,", "You know what?", "Honestly,". Just tell the story without filler.
4. **No dashes or ellipses:** Do NOT use em dashes, en dashes, or ellipses. Use commas and periods for rhythm and pauses.
5. **Phonetically clear:** Write words that are easy to pronounce for text-to-speech. Avoid difficult word combinations, tongue twisters, and unusual loanwords. Use simple, clear words.

IMPORTANT:
- Write in plain text, NO SSML tags, NO markers in brackets.
- Do NOT use markdown formatting or headings.`;
}

function getSsmlInstructions(language: string): string {
  const ssmlTags = `
- \`<break time="300ms"/>\` to \`<break time="800ms"/>\`
- \`<prosody rate="90%">...</prosody>\`
- \`<prosody rate="105%">...</prosody>\`
- \`<emphasis level="strong">...</emphasis>\``;

  const instructions: Record<string, string> = {
    nl: `

## SSML-opmaak (VERPLICHT)
De audio wordt gegenereerd met Google Neural2. Je MOET het volledige script in SSML-formaat schrijven om natuurlijke spraak te bereiken.

Omsluit het hele script met \`<speak>\` tags. Gebruik deze SSML-tags door het hele script:
${ssmlTags}

Schrijfregels voor SSML-scripts:
- Schrijf altijd voluit, geen afkortingen: "het" in plaats van "'t", "er" in plaats van "d'r", "mijn" in plaats van "m'n".
- Gebruik GEEN liggende streepjes of drie puntjes. Gebruik komma's, punten en break-tags voor pauzes.
- Schrijf fonetisch helder: vermijd moeilijke woordcombinaties en tongbrekers.

Voorbeeld van correcte output:
<speak>De regen valt op de kasseien. <break time="400ms"/> En daar, om de hoek, <prosody rate="90%">zie je het licht van een klein cafe.</prosody> <break time="300ms"/> <emphasis level="strong">Dit</emphasis> is het Parijs dat de meeste toeristen nooit zien.</speak>

BELANGRIJK:
- Het HELE script moet binnen \`<speak>\` en \`</speak>\` tags staan.
- Gebruik GEEN markdown-opmaak of koppen in het SSML-script.
- Elke alinea moet zelfstandig zijn qua SSML-tags: open en sluit tags als \`<prosody>\` en \`<emphasis>\` altijd binnen dezelfde alinea. Laat tags NOOIT doorlopen over meerdere alinea's.
- Gebruik ALLEEN de tags uit de bovenstaande lijst (\`<break>\`, \`<prosody>\`, \`<emphasis>\`). Geen andere SSML-tags.`,

    fr: `

## Mise en forme SSML (OBLIGATOIRE)
L'audio sera genere avec Google Neural2. Vous DEVEZ ecrire le script entier en format SSML pour obtenir une parole naturelle.

Enveloppez le script entier dans des balises \`<speak>\`. Utilisez ces balises SSML dans tout le script:
${ssmlTags}

Regles d'ecriture pour les scripts SSML:
- Ecrivez les mots en entier, pas d'abreviations ni de contractions familieres.
- N'utilisez PAS de tirets longs ou de points de suspension. Utilisez des virgules, des points et des balises break pour les pauses.
- Ecrivez un texte phonetiquement clair: evitez les combinaisons de mots difficiles.

IMPORTANT:
- Le script ENTIER doit etre dans les balises \`<speak>\` et \`</speak>\`.
- N'utilisez PAS de mise en forme markdown ou de titres dans le script SSML.
- Chaque paragraphe doit etre autonome pour les balises SSML: ouvrez et fermez toujours les balises dans le meme paragraphe.
- Utilisez UNIQUEMENT les balises listees ci-dessus.`,

    de: `

## SSML-Formatierung (PFLICHT)
Das Audio wird mit Google Neural2 generiert. Du MUSST das gesamte Skript im SSML-Format schreiben, um natuerliche Sprache zu erreichen.

Umschliesse das gesamte Skript mit \`<speak>\`-Tags. Verwende diese SSML-Tags im gesamten Skript:
${ssmlTags}

Schreibregeln fuer SSML-Skripte:
- Schreibe Woerter vollstaendig aus, keine Abkuerzungen oder umgangssprachliche Verkuerzungen.
- Verwende KEINE Gedankenstriche oder Auslassungspunkte. Verwende Kommas, Punkte und Break-Tags fuer Pausen.
- Schreibe phonetisch klaren Text: vermeide schwierige Wortkombinationen und Zungenbrecher.

WICHTIG:
- Das GESAMTE Skript muss innerhalb von \`<speak>\`- und \`</speak>\`-Tags stehen.
- Verwende KEINE Markdown-Formatierung oder Ueberschriften im SSML-Skript.
- Jeder Absatz muss fuer SSML-Tags eigenstaendig sein: oeffne und schliesse Tags immer innerhalb desselben Absatzes.
- Verwende NUR die oben aufgelisteten Tags.`,

    es: `

## Formato SSML (OBLIGATORIO)
El audio se generara con Google Neural2. DEBES escribir el script completo en formato SSML para lograr un habla natural.

Envuelve el script completo en etiquetas \`<speak>\`. Usa estas etiquetas SSML en todo el script:
${ssmlTags}

Reglas de escritura para scripts SSML:
- Escribe las palabras completas, sin abreviaturas ni contracciones coloquiales.
- NO uses guiones largos o puntos suspensivos. Usa comas, puntos y etiquetas break para las pausas.
- Escribe texto foneticamente claro: evita combinaciones de palabras dificiles y trabalenguas.

IMPORTANTE:
- El script COMPLETO debe estar dentro de las etiquetas \`<speak>\` y \`</speak>\`.
- NO uses formato markdown o encabezados dentro del script SSML.
- Cada parrafo debe ser autonomo para las etiquetas SSML: siempre abre y cierra las etiquetas dentro del mismo parrafo.
- Usa SOLO las etiquetas listadas arriba.`,
  };

  return instructions[language] || `

## SSML Formatting (MANDATORY)
The audio will be generated with Google Neural2. You MUST write the entire script in SSML format to achieve natural speech.

Wrap the entire script in \`<speak>\` tags. Use these SSML tags throughout the script:
${ssmlTags}

Writing rules for SSML scripts:
- Write words out in full, no abbreviations: "it is" instead of "it's", "do not" instead of "don't".
- Do NOT use em dashes or ellipses. Use commas, periods, and break tags for pauses.
- Write phonetically clear text: avoid difficult word combinations and tongue twisters.

Example of correct output:
<speak>Rain falls on the cobblestones. <break time="400ms"/> And there, around the corner, <prosody rate="90%">you see the light of a small cafe.</prosody> <break time="300ms"/> <emphasis level="strong">This</emphasis> is the Paris most tourists never see.</speak>

IMPORTANT:
- The ENTIRE script must be within \`<speak>\` and \`</speak>\` tags.
- Do NOT use markdown formatting or headings inside the SSML script.
- Each paragraph must be self-contained for SSML tags: always open and close tags like \`<prosody>\` and \`<emphasis>\` within the same paragraph. NEVER let tags span across multiple paragraphs.
- Use ONLY the tags listed above (\`<break>\`, \`<prosody>\`, \`<emphasis>\`). No other SSML tags.`;
}

function stripSsmlTags(text: string): string {
  let clean = text.replace(/<[^>]+>/g, "");
  clean = clean.replace(/\n{3,}/g, "\n\n");
  clean = clean.replace(/ {2,}/g, " ");
  return clean.trim();
}

function getGoogleTtsInstructions(language: string, voiceType: VoiceType): string {
  if (voiceType === "chirp3") {
    return getChirp3Instructions(language);
  }
  return getSsmlInstructions(language);
}

function getLanguageKey(language: string): "en" | "nl" | "fr" | "de" | "es" {
  if (["nl", "fr", "de", "es"].includes(language)) return language as any;
  return "en";
}

interface SiblingAngle {
  name: string;
  description: string;
}

const themeAngleDefinitions: Record<string, { id: string; names: Record<string, string>; descriptions: Record<string, string> }[]> = {
  revolution: [
    { id: "historical", names: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" }, descriptions: { en: "Facts, dates, and chronological storytelling", nl: "Feiten, data en chronologisch vertellen", fr: "Faits, dates et récit chronologique", de: "Fakten, Daten und chronologisches Erzählen", es: "Hechos, fechas y narración cronológica" } },
    { id: "personal-stories", names: { en: "Personal Stories", nl: "Persoonlijke Verhalen", fr: "Histoires personnelles", de: "Persönliche Geschichten", es: "Historias personales" }, descriptions: { en: "The story told from the iconic figures involved", nl: "Het verhaal verteld vanuit de iconische figuren", fr: "L'histoire racontée du point de vue des personnages emblématiques", de: "Die Geschichte aus der Perspektive der beteiligten ikonischen Figuren", es: "La historia contada desde las figuras icónicas involucradas" } },
  ],
  museums: [
    { id: "origin", names: { en: "Origin of the Museum", nl: "Ontstaan van het Museum", fr: "Origine du Musée", de: "Ursprung des Museums", es: "Origen del Museo" }, descriptions: { en: "The founding story and how the museum came to be", nl: "Het ontstaansverhaal en hoe het museum tot stand kwam", fr: "L'histoire de sa fondation et comment le musée est né", de: "Die Gründungsgeschichte und wie das Museum entstand", es: "La historia de su fundación y cómo nació el museo" } },
    { id: "prominent-art", names: { en: "Prominent Art Pieces", nl: "Prominente Kunstwerken", fr: "Œuvres d'art emblématiques", de: "Bedeutende Kunstwerke", es: "Obras de arte destacadas" }, descriptions: { en: "The most famous and significant works in the collection", nl: "De beroemdste en belangrijkste werken in de collectie", fr: "Les œuvres les plus célèbres et les plus importantes de la collection", de: "Die berühmtesten und bedeutendsten Werke der Sammlung", es: "Las obras más famosas e importantes de la colección" } },
    { id: "architecture", names: { en: "Architecture & Building", nl: "Architectuur & Gebouw", fr: "Architecture & Bâtiment", de: "Architektur & Gebäude", es: "Arquitectura & Edificio" }, descriptions: { en: "The architectural story and design of the building itself", nl: "Het architectuurverhaal en het ontwerp van het gebouw zelf", fr: "L'histoire architecturale et le design du bâtiment lui-même", de: "Die architektonische Geschichte und Gestaltung des Gebäudes selbst", es: "La historia arquitectónica y el diseño del edificio en sí" } },
  ],
  neighborhoods: [
    { id: "historical", names: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" }, descriptions: { en: "The origins and historical evolution of this neighborhood", nl: "De oorsprong en historische ontwikkeling van deze buurt", fr: "Les origines et l'évolution historique de ce quartier", de: "Die Ursprünge und die historische Entwicklung dieses Viertels", es: "Los orígenes y la evolución histórica de este barrio" } },
    { id: "cultural", names: { en: "Cultural", nl: "Cultureel", fr: "Culturel", de: "Kulturell", es: "Cultural" }, descriptions: { en: "Art, food, lifestyle, and cultural significance", nl: "Kunst, eten, levensstijl en culturele betekenis", fr: "Art, gastronomie, mode de vie et importance culturelle", de: "Kunst, Essen, Lebensstil und kulturelle Bedeutung", es: "Arte, gastronomía, estilo de vida e importancia cultural" } },
    { id: "modern-times", names: { en: "Modern Times", nl: "Moderne Tijd", fr: "Époque moderne", de: "Moderne Zeit", es: "Tiempos modernos" }, descriptions: { en: "What the neighborhood looks like today and how it has evolved", nl: "Hoe de buurt er vandaag uitziet en hoe deze is geëvolueerd", fr: "À quoi ressemble le quartier aujourd'hui et comment il a évolué", de: "Wie das Viertel heute aussieht und wie es sich entwickelt hat", es: "Cómo se ve el barrio hoy y cómo ha evolucionado" } },
    { id: "walking-tour", names: { en: "Walking Tour", nl: "Wandeltour", fr: "Visite à pied", de: "Rundgang", es: "Paseo guiado" }, descriptions: { en: "A guided walk past the best and most famous places in the area", nl: "Een begeleide wandeling langs de beste en beroemdste plekken", fr: "Une promenade guidée devant les meilleurs endroits du quartier", de: "Ein geführter Spaziergang an den besten und berühmtesten Orten", es: "Un paseo guiado por los mejores y más famosos lugares de la zona" } },
  ],
};

const topicToThemeMap: Record<string, string> = {
  "bastille": "revolution", "bastille-walk": "revolution", "marie-antoinette": "revolution",
  "danton": "revolution", "reign-of-terror": "revolution", "conciergerie-walk": "revolution",
  "napoleon": "revolution", "charlotte-corday": "revolution",
  "louvre": "museums", "orsay": "museums", "pompidou": "museums", "orangerie": "museums",
  "bourse-commerce": "museums", "rodin": "museums", "fondation-lv": "museums", "musee-carnavalet": "museums",
  "montmartre": "neighborhoods", "montmartre-walk": "neighborhoods", "le-marais": "neighborhoods",
  "pigalle": "neighborhoods", "saint-germain": "neighborhoods", "latin-quarter": "neighborhoods",
  "belleville": "neighborhoods", "ile-de-la-cite": "neighborhoods",
};

function getSiblingAngles(topicId: string | undefined, currentPerspective: string, language: string): SiblingAngle[] {
  if (!topicId || !currentPerspective) return [];
  const themeId = topicToThemeMap[topicId];
  if (!themeId) return [];
  const angles = themeAngleDefinitions[themeId];
  if (!angles) return [];
  const langKey = getLanguageKey(language);
  return angles
    .filter(a => a.id !== currentPerspective)
    .map(a => ({ name: a.names[langKey] || a.names.en, description: a.descriptions[langKey] || a.descriptions.en }));
}

function buildFocusGuidance(siblingAngles: SiblingAngle[], language: string): string {
  if (siblingAngles.length === 0) return "";
  const langKey = getLanguageKey(language);
  const angleList = siblingAngles.map(a => `- "${a.name}": ${a.description}`).join("\n");
  const templates: Record<string, string> = {
    nl: `\n\n## Focusbegeleiding
Er bestaan aparte afleveringen over dit onderwerp vanuit andere invalshoeken:
${angleList}
Omdat de luisteraar die apart kan beluisteren, hoef je daar niet uitgebreid over te praten. Noem deze onderwerpen alleen kort als het echt relevant is voor jouw verhaal, maar besteed er geen grote passages aan.`,
    fr: `\n\n## Guide de focus
Il existe des épisodes séparés sur ce sujet avec d'autres perspectives :
${angleList}
Comme l'auditeur peut les écouter séparément, ne vous attardez pas sur ces sujets. Mentionnez-les brièvement uniquement si c'est vraiment pertinent pour votre récit, mais n'y consacrez pas de longs passages.`,
    de: `\n\n## Fokus-Leitfaden
Es gibt separate Folgen zu diesem Thema aus anderen Blickwinkeln:
${angleList}
Da der Zuhörer diese separat anhören kann, musst du darauf nicht ausführlich eingehen. Erwähne diese Themen nur kurz, wenn es wirklich relevant für deine Geschichte ist, aber widme ihnen keine langen Abschnitte.`,
    es: `\n\n## Guía de enfoque
Existen episodios separados sobre este tema desde otras perspectivas:
${angleList}
Como el oyente puede escucharlos por separado, no necesitas hablar extensamente sobre ellos. Menciona estos temas solo brevemente si es realmente relevante para tu historia, pero no les dediques pasajes largos.`,
    en: `\n\n## Focus Guidance
There are separate episodes about this topic from other perspectives:
${angleList}
Since the listener can listen to those separately, do not spend much time on those areas. Only mention them briefly if truly relevant to your story, but do not dedicate long passages to them.`,
  };
  return templates[langKey] || templates.en;
}

function getSystemPrompt(language: string, perspective: string, wordCount: number, googleVoiceType?: VoiceType, siblingAngles?: SiblingAngle[]): string {
  const langKey = getLanguageKey(language);

  const perspectiveMap: Record<string, Record<string, string>> = {
    historical: {
      en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context. Weave the facts into a compelling narrative rather than a dry summary.",
      nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op. Weef de feiten in een meeslepend verhaal, geen droge samenvatting.",
      fr: "Utilisez une approche narrative factuelle et chronologique. Incluez des dates, des noms et un contexte historique precis. Tissez les faits dans un recit captivant plutot qu'un resume sec.",
      de: "Verwende einen faktenbasierten, chronologischen Erzaehlansatz. Nenne konkrete Daten, Namen und historischen Kontext. Verwebe die Fakten zu einer fesselnden Erzaehlung statt einer trockenen Zusammenfassung.",
      es: "Utiliza un enfoque narrativo factual y cronologico. Incluye fechas, nombres y contexto historico especificos. Teje los hechos en una narrativa cautivadora en lugar de un resumen seco.",
    },
    "personal-stories": {
      en: "Focus on the key personalities and iconic figures central to this story. Bring them to life with vivid character details, their motivations, rivalries, and the human drama behind the events.",
      nl: "Focus op de belangrijkste persoonlijkheden en iconische figuren in dit verhaal. Breng ze tot leven met levendige karakterdetails, hun motivaties, rivaliteiten en het menselijke drama achter de gebeurtenissen.",
      fr: "Concentrez-vous sur les personnalites cles et les figures emblematiques au coeur de cette histoire. Donnez-leur vie avec des details de caractere saisissants, leurs motivations, rivalites et le drame humain derriere les evenements.",
      de: "Konzentriere dich auf die Schluesselpersoenlichkeiten und ikonischen Figuren dieser Geschichte. Erwecke sie zum Leben mit lebhaften Charakterdetails, ihren Motivationen, Rivalitaeten und dem menschlichen Drama hinter den Ereignissen.",
      es: "Concentrate en las personalidades clave y las figuras iconicas centrales de esta historia. Dalas vida con detalles vividos de sus caracteres, sus motivaciones, rivalidades y el drama humano detras de los eventos.",
    },
    "iconic-figures": {
      en: "Focus on the key personalities and iconic figures central to this story. Bring them to life with vivid character details, their motivations, rivalries, and the human drama behind the events.",
      nl: "Focus op de belangrijkste persoonlijkheden en iconische figuren in dit verhaal. Breng ze tot leven met levendige karakterdetails, hun motivaties, rivaliteiten en het menselijke drama achter de gebeurtenissen.",
      fr: "Concentrez-vous sur les personnalites cles et les figures emblematiques au coeur de cette histoire. Donnez-leur vie avec des details de caractere saisissants, leurs motivations, rivalites et le drame humain derriere les evenements.",
      de: "Konzentriere dich auf die Schluesselpersoenlichkeiten und ikonischen Figuren dieser Geschichte. Erwecke sie zum Leben mit lebhaften Charakterdetails, ihren Motivationen, Rivalitaeten und dem menschlichen Drama hinter den Ereignissen.",
      es: "Concentrate en las personalidades clave y las figuras iconicas centrales de esta historia. Dalas vida con detalles vividos de sus caracteres, sus motivaciones, rivalidades y el drama humano detras de los eventos.",
    },
    origin: {
      en: "Tell the founding story of this place or museum. How did it come to be? What vision drove its creation? Cover the key moments from its origins to what it is today.",
      nl: "Vertel het ontstaansverhaal van deze plek of dit museum. Hoe is het tot stand gekomen? Welke visie dreef de oprichting? Behandel de belangrijkste momenten van het ontstaan tot wat het nu is.",
      fr: "Racontez l'histoire de la fondation de ce lieu ou de ce musee. Comment est-il ne? Quelle vision a guide sa creation? Couvrez les moments cles de ses origines a ce qu'il est aujourd'hui.",
      de: "Erzaehle die Gruendungsgeschichte dieses Ortes oder Museums. Wie ist er entstanden? Welche Vision trieb seine Gruendung an? Behandle die wichtigsten Momente von den Anfaengen bis heute.",
      es: "Cuenta la historia de la fundacion de este lugar o museo. Como llego a existir? Que vision impulso su creacion? Cubre los momentos clave desde sus origenes hasta lo que es hoy.",
    },
    "prominent-art": {
      en: "Focus on the most famous and significant artworks in the collection. Tell the stories behind the masterpieces, who created them, why, and what makes them extraordinary.",
      nl: "Focus op de beroemdste en belangrijkste kunstwerken in de collectie. Vertel de verhalen achter de meesterwerken, wie ze maakte, waarom, en wat ze buitengewoon maakt.",
      fr: "Concentrez-vous sur les oeuvres d'art les plus celebres et les plus importantes de la collection. Racontez les histoires derriere les chefs-d'oeuvre, qui les a crees, pourquoi, et ce qui les rend extraordinaires.",
      de: "Konzentriere dich auf die beruehmtesten und bedeutendsten Kunstwerke der Sammlung. Erzaehle die Geschichten hinter den Meisterwerken, wer sie geschaffen hat, warum, und was sie aussergewoehnlich macht.",
      es: "Concentrate en las obras de arte mas famosas e importantes de la coleccion. Cuenta las historias detras de las obras maestras, quien las creo, por que y que las hace extraordinarias.",
    },
    architecture: {
      en: "Focus on the architecture and the building itself. Describe its design, the architect's vision, the construction story, and the architectural details that make it remarkable.",
      nl: "Focus op de architectuur en het gebouw zelf. Beschrijf het ontwerp, de visie van de architect, het bouwverhaal en de architectonische details die het bijzonder maken.",
      fr: "Concentrez-vous sur l'architecture et le batiment lui-meme. Decrivez sa conception, la vision de l'architecte, l'histoire de la construction et les details architecturaux qui le rendent remarquable.",
      de: "Konzentriere dich auf die Architektur und das Gebaeude selbst. Beschreibe das Design, die Vision des Architekten, die Baugeschichte und die architektonischen Details, die es bemerkenswert machen.",
      es: "Concentrate en la arquitectura y el edificio en si. Describe su diseno, la vision del arquitecto, la historia de la construccion y los detalles arquitectonicos que lo hacen notable.",
    },
    cultural: {
      en: "Focus on art, food, lifestyle, and cultural significance. Explore how culture shaped and was shaped by this topic.",
      nl: "Focus op kunst, eten, levensstijl en culturele betekenis. Verken hoe cultuur dit onderwerp vormde en erdoor werd gevormd.",
      fr: "Concentrez-vous sur l'art, la gastronomie, le mode de vie et la signification culturelle. Explorez comment la culture a faconne et a ete faconnee par ce sujet.",
      de: "Konzentriere dich auf Kunst, Essen, Lebensstil und kulturelle Bedeutung. Erkunde, wie Kultur dieses Thema geformt hat und davon geformt wurde.",
      es: "Concentrate en el arte, la gastronomia, el estilo de vida y la importancia cultural. Explora como la cultura moldeo y fue moldeada por este tema.",
    },
    "modern-times": {
      en: "Tell the story of how this place looks and feels today. What has changed in recent decades? How does modern life play out here? Capture the contemporary atmosphere.",
      nl: "Vertel het verhaal van hoe deze plek er vandaag uitziet en aanvoelt. Wat is er de afgelopen decennia veranderd? Hoe speelt het moderne leven zich hier af? Vang de hedendaagse sfeer.",
      fr: "Racontez l'histoire de ce lieu tel qu'il est aujourd'hui. Qu'est-ce qui a change ces dernieres decennies? Comment la vie moderne s'y deroule-t-elle? Capturez l'atmosphere contemporaine.",
      de: "Erzaehle die Geschichte, wie dieser Ort heute aussieht und sich anfuehlt. Was hat sich in den letzten Jahrzehnten veraendert? Wie spielt sich das moderne Leben hier ab? Fange die zeitgenoessische Atmosphaere ein.",
      es: "Cuenta la historia de como se ve y se siente este lugar hoy. Que ha cambiado en las ultimas decadas? Como se desarrolla la vida moderna aqui? Captura la atmosfera contemporanea.",
    },
    "walking-tour": {
      en: "Guide the listener as if walking through Paris together. Describe what they would see, hear, and smell. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.",
      nl: "Begeleid de luisteraar alsof je samen door Parijs wandelt. Beschrijf wat ze zouden zien, horen en ruiken. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details.",
      fr: "Guidez l'auditeur comme si vous marchiez ensemble dans Paris. Decrivez ce qu'il verrait, entendrait et sentirait. Emmenez-le aux meilleurs endroits et aux plus celebres du quartier. Utilisez un langage directionnel et des details sensoriels vivants.",
      de: "Fuehre den Zuhoerer, als wuerdet ihr gemeinsam durch Paris spazieren. Beschreibe, was er sehen, hoeren und riechen wuerde. Nimm ihn mit zu den besten und beruehmtesten Orten der Gegend. Verwende Richtungsangaben und lebendige sensorische Details.",
      es: "Guia al oyente como si caminaran juntos por Paris. Describe lo que veria, escucharia y oleria. Lleva al oyente a los mejores y mas famosos lugares de la zona. Usa lenguaje direccional y detalles sensoriales vividos.",
    },
  };

  const defaultStyle: Record<string, string> = {
    en: "Tell an engaging, well-rounded story covering the most interesting aspects of this topic.",
    nl: "Vertel een boeiend, veelzijdig verhaal dat de meest interessante aspecten van dit onderwerp behandelt.",
    fr: "Racontez une histoire captivante et complete couvrant les aspects les plus interessants de ce sujet.",
    de: "Erzaehle eine fesselnde, vielseitige Geschichte, die die interessantesten Aspekte dieses Themas behandelt.",
    es: "Cuenta una historia cautivadora y completa que cubra los aspectos mas interesantes de este tema.",
  };
  const perspectiveText = perspective
    ? (perspectiveMap[perspective]?.[langKey] || defaultStyle[langKey])
    : defaultStyle[langKey];

  const prompts: Record<string, string> = {
    nl: `## Jouw Rol
Je bent een deskundige solo-podcastverteller. Je bent een ervaren gids die met de luisteraar door Parijs wandelt. Je vertelstijl is warm maar nuchter. Je deelt feiten en achtergronden op een toegankelijke, ontspannen manier. Je schrijft in vloeiend, natuurlijk Nederlands.

## Perspectief
${perspectiveText}

## Toon
Houd de toon informatief en nuchter, met af en toe een persoonlijke noot. Vermijd overdreven dramatiek, poetische overdrijvingen en theatrale effecten. Wees eerder een goede vriend die iets interessants vertelt dan een acteur die een rol speelt. Laat de feiten voor zich spreken.

## Audio-optimalisatie (voor TTS)
Om natuurlijk te klinken, hanteer je deze regels:
1. **Geen afkortingen:** Schrijf altijd voluit. Gebruik "het" in plaats van "'t", "er" in plaats van "d'r", "mijn" in plaats van "m'n", "een" in plaats van "'n". Geen samentrekkingen.
2. **Geen streepjes of drie puntjes:** Gebruik GEEN liggende streepjes (—), GEEN drie puntjes (...). Gebruik gewone komma's en punten voor ritme en pauzes.
3. **Geen stopwoordjes:** Vermijd vulwoorden als "Tja,", "Kijk,", "Hè,", "Hoor je dat?", "Weet je wat?", "Echt waar,". Vertel gewoon het verhaal zonder dit soort opvulling.
4. **Zinsopbouw:** Wissel korte en langere zinnen af. Vermijd ingewikkelde bijzinnen.
5. **Fonetisch helder:** Schrijf woorden die goed uitspreekbaar zijn voor text-to-speech. Vermijd moeilijke woordcombinaties, tongbrekers en ongebruikelijke leenwoorden. Gebruik eenvoudige, heldere Nederlandse woorden.
6. **Concreet:** Noem specifieke namen, data, adressen en feiten. Dat maakt het verhaal geloofwaardig en informatief.

## Schrijfregels
- GEEN titels, GEEN "Welkom bij...", GEEN introductie van jezelf.
- Begin direct met het onderwerp, geen omslachtige inleiding.
- Schrijf in vloeiende alinea's zonder koppen of opsommingstekens.
- Gebruik 'je' en 'jij' om een directe band met de luisteraar op te bouwen.
- Lengte: schrijf ongeveer ${wordCount} woorden.
- Eindig met een interessant feit of een gedachte die blijft hangen.${googleVoiceType ? getGoogleTtsInstructions("nl", googleVoiceType) : ""}`,

    fr: `## Votre Role
Vous etes un narrateur de podcast solo expert. Vous etes un guide experimente qui marche dans Paris avec l'auditeur. Votre style est chaleureux mais ancre dans les faits. Vous partagez des faits et du contexte de maniere accessible et detendue. Vous ecrivez en francais fluide et naturel.

## Perspective
${perspectiveText}

## Ton
Gardez un ton informatif et terre-a-terre, avec des touches personnelles occasionnelles. Evitez le drame excessif, les exagerations poetiques et les effets theatraux. Soyez plutot un bon ami qui partage quelque chose d'interessant qu'un acteur jouant un role. Laissez les faits parler d'eux-memes.

## Optimisation audio (pour TTS)
Pour sonner naturellement, suivez ces regles:
1. **Pas d'abreviations:** Ecrivez les mots en entier. Utilisez "il ne faut pas" au lieu de "faut pas", "je ne sais pas" au lieu de "j'sais pas". Pas de contractions famillieres.
2. **Pas de tirets ou points de suspension:** N'utilisez PAS de tirets longs, de tirets courts ou de points de suspension. Utilisez des virgules et des points pour le rythme et les pauses.
3. **Pas de mots de remplissage:** Evitez les mots comme "Bon,", "Alors,", "Ecoutez,", "Vous savez quoi?", "Franchement,". Racontez simplement l'histoire sans remplissage.
4. **Structure des phrases:** Alternez phrases courtes et longues. Evitez les propositions subordonnees complexes.
5. **Phonetiquement clair:** Ecrivez des mots faciles a prononcer pour la synthese vocale. Evitez les combinaisons de mots difficiles et les mots empruntes inhabituels. Utilisez des mots simples et clairs.
6. **Soyez precis:** Mentionnez des noms, dates, adresses et faits specifiques. Cela rend l'histoire credible et informative.

## Regles d'ecriture
- PAS de titres, PAS de "Bienvenue a...", PAS de presentation de vous-meme.
- Commencez directement avec le sujet, pas d'introduction longue.
- Ecrivez en paragraphes fluides sans titres ni puces.
- Utilisez "vous" pour creer un lien direct avec l'auditeur.
- Longueur: ecrivez environ ${wordCount} mots.
- Terminez avec un fait interessant ou une pensee qui reste.${googleVoiceType ? getGoogleTtsInstructions("fr", googleVoiceType) : ""}`,

    de: `## Deine Rolle
Du bist ein sachkundiger Solo-Podcast-Erzaehler. Du bist ein erfahrener Guide, der mit dem Zuhoerer durch Paris spaziert. Dein Stil ist warm, aber sachlich. Du teilst Fakten und Hintergruende auf zugaengliche, entspannte Weise. Du schreibst in fliessendem, natuerlichem Deutsch.

## Perspektive
${perspectiveText}

## Ton
Halte den Ton informativ und bodenstaendig, mit gelegentlichen persoenlichen Akzenten. Vermeide uebertriebene Dramatik, poetische Uebertreibungen und theatralische Effekte. Sei eher ein guter Freund, der etwas Interessantes erzaehlt, als ein Schauspieler, der eine Rolle spielt. Lass die Fakten fuer sich sprechen.

## Audio-Optimierung (fuer TTS)
Um natuerlich zu klingen, befolge diese Regeln:
1. **Keine Abkuerzungen:** Schreibe Woerter vollstaendig aus. Verwende "es ist" statt "es ist", "ich habe" statt "ich hab". Keine umgangssprachlichen Verkuerzungen.
2. **Keine Gedankenstriche oder Auslassungspunkte:** Verwende KEINE Gedankenstriche oder Auslassungspunkte. Verwende Kommas und Punkte fuer Rhythmus und Pausen.
3. **Keine Fuellwoerter:** Vermeide Woerter wie "Nun ja,", "Schau mal,", "Weisst du was?", "Ehrlich gesagt,". Erzaehle einfach die Geschichte ohne Fuellung.
4. **Satzbau:** Wechsle kurze und laengere Saetze ab. Vermeide komplexe Nebensaetze.
5. **Phonetisch klar:** Schreibe Woerter, die fuer die Sprachsynthese leicht auszusprechen sind. Vermeide schwierige Wortkombinationen, Zungenbrecher und ungewoehnliche Fremdwoerter. Verwende einfache, klare Woerter.
6. **Konkret:** Nenne spezifische Namen, Daten, Adressen und Fakten. Das macht die Geschichte glaubwuerdig und informativ.

## Schreibregeln
- KEINE Titel, KEIN "Willkommen bei...", KEINE Vorstellung deiner selbst.
- Beginne direkt mit dem Thema, keine umstaendliche Einleitung.
- Schreibe in fliessenden Absaetzen ohne Ueberschriften oder Aufzaehlungszeichen.
- Verwende "du" um eine direkte Verbindung mit dem Zuhoerer aufzubauen.
- Laenge: schreibe ungefaehr ${wordCount} Woerter.
- Ende mit einem interessanten Fakt oder einem Gedanken, der nachhallt.${googleVoiceType ? getGoogleTtsInstructions("de", googleVoiceType) : ""}`,

    es: `## Tu Rol
Eres un narrador experto de podcast en solitario. Eres un guia experimentado que camina por Paris con el oyente. Tu estilo es calido pero basado en hechos. Compartes datos y contexto de manera accesible y relajada. Escribes en espanol fluido y natural.

## Perspectiva
${perspectiveText}

## Tono
Manten un tono informativo y cercano, con toques personales ocasionales. Evita el drama excesivo, las exageraciones poeticas y los efectos teatrales. Se mas como un buen amigo que comparte algo interesante que un actor interpretando un papel. Deja que los hechos hablen por si mismos.

## Optimizacion de audio (para TTS)
Para sonar natural, sigue estas reglas:
1. **Sin abreviaturas:** Escribe las palabras completas. No uses contracciones coloquiales.
2. **Sin guiones o puntos suspensivos:** NO uses guiones largos, guiones cortos o puntos suspensivos. Usa comas y puntos para el ritmo y las pausas.
3. **Sin palabras de relleno:** Evita palabras como "Bueno,", "Mira,", "Sabes que?", "La verdad,", "Oye,". Simplemente cuenta la historia sin relleno.
4. **Estructura de oraciones:** Alterna oraciones cortas y largas. Evita clausulas subordinadas complejas.
5. **Foneticamente claro:** Escribe palabras faciles de pronunciar para la sintesis de voz. Evita combinaciones de palabras dificiles, trabalenguas y extranjerismos inusuales. Usa palabras simples y claras.
6. **Se especifico:** Menciona nombres, fechas, direcciones y hechos especificos. Esto hace la historia creible e informativa.

## Reglas de escritura
- SIN titulos, SIN "Bienvenidos a...", SIN presentarte a ti mismo.
- Comienza directamente con el tema, sin introduccion extensa.
- Escribe en parrafos fluidos sin encabezados ni vinetas.
- Usa "tu" para construir una conexion directa con el oyente.
- Longitud: escribe aproximadamente ${wordCount} palabras.
- Termina con un hecho interesante o un pensamiento que permanezca.${googleVoiceType ? getGoogleTtsInstructions("es", googleVoiceType) : ""}`,

    en: `## Your Role
You are a knowledgeable solo podcast storyteller. You are an experienced guide walking through Paris with the listener. Your style is warm but grounded. You share facts and context in an accessible, relaxed way. You write in fluent, natural English.

## Perspective
${perspectiveText}

## Tone
Keep the tone informative and down-to-earth, with occasional personal touches. Avoid excessive drama, poetic exaggeration, and theatrical effects. Be more like a good friend sharing something interesting than an actor performing a role. Let the facts speak for themselves.

## Audio Optimization (for TTS)
To sound natural, follow these rules:
1. **No abbreviations:** Write words out in full. Use "it is" instead of "it's", "they would" instead of "they'd", "do not" instead of "don't". No contractions.
2. **No dashes or ellipses:** Do NOT use em dashes, en dashes, or ellipses. Use commas and periods for rhythm and pauses.
3. **No filler words:** Avoid filler words like "Well,", "Look,", "You know what?", "Honestly,", "Hear that?". Just tell the story without filler.
4. **Sentence structure:** Alternate short and longer sentences. Avoid complex subordinate clauses.
5. **Phonetically clear:** Write words that are easy to pronounce for text-to-speech. Avoid difficult word combinations, tongue twisters, and unusual loanwords. Use simple, clear words.
6. **Be specific:** Mention specific names, dates, addresses, and facts. This makes the story credible and informative.

## Writing Rules
- NO titles, NO "Welcome to...", NO introducing yourself.
- Start directly with the topic, no lengthy introduction.
- Write in flowing paragraphs without headings or bullet points.
- Use 'you' to build a direct connection with the listener.
- Length: write approximately ${wordCount} words.
- End with an interesting fact or a thought that lingers.${googleVoiceType ? getGoogleTtsInstructions("en", googleVoiceType) : ""}`,
  };

  const focusGuidance = siblingAngles && siblingAngles.length > 0
    ? buildFocusGuidance(siblingAngles, language)
    : "";

  return (prompts[langKey] || prompts.en) + focusGuidance;
}

function findDataChunk(wav: Buffer): { offset: number; size: number } | null {
  let pos = 12;
  while (pos < wav.length - 8) {
    const chunkId = wav.toString("ascii", pos, pos + 4);
    const chunkSize = wav.readUInt32LE(pos + 4);
    if (chunkId === "data") {
      return { offset: pos + 8, size: chunkSize };
    }
    pos += 8 + chunkSize;
    if (chunkSize % 2 !== 0) pos++;
  }
  return null;
}

async function concatenateWavBuffers(buffers: Buffer[]): Promise<Buffer> {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  const pcmChunks: Buffer[] = [];
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;

  for (const wav of buffers) {
    if (wav.length < 44) continue;

    let pos = 12;
    while (pos < wav.length - 8) {
      const chunkId = wav.toString("ascii", pos, pos + 4);
      const chunkSize = wav.readUInt32LE(pos + 4);

      if (chunkId === "fmt ") {
        numChannels = wav.readUInt16LE(pos + 10);
        sampleRate = wav.readUInt32LE(pos + 12);
        bitsPerSample = wav.readUInt16LE(pos + 22);
      }

      if (chunkId === "data") {
        const end = Math.min(pos + 8 + chunkSize, wav.length);
        pcmChunks.push(wav.subarray(pos + 8, end));
        break;
      }

      pos += 8 + chunkSize;
      if (chunkSize % 2 !== 0) pos++;
    }
  }

  const fadeMs = 40;
  const fadeSamples = Math.floor(sampleRate * (fadeMs / 1000));
  const bytesPerSample = bitsPerSample / 8;

  const silenceMs = 100;
  const silenceSamples = Math.floor(sampleRate * (silenceMs / 1000));
  const silenceBuffer = Buffer.alloc(silenceSamples * bytesPerSample);

  for (let i = 0; i < pcmChunks.length; i++) {
    const chunk = pcmChunks[i];
    const totalSamples = Math.floor(chunk.length / bytesPerSample);

    if (i > 0) {
      const samplesToFade = Math.min(fadeSamples, totalSamples);
      for (let s = 0; s < samplesToFade; s++) {
        const offset = s * bytesPerSample;
        if (offset + 1 >= chunk.length) break;
        const sample = chunk.readInt16LE(offset);
        const gain = s / samplesToFade;
        chunk.writeInt16LE(Math.round(sample * gain), offset);
      }
    }

    if (i < pcmChunks.length - 1) {
      const samplesToFade = Math.min(fadeSamples, totalSamples);
      for (let s = 0; s < samplesToFade; s++) {
        const offset = chunk.length - ((samplesToFade - s) * bytesPerSample);
        if (offset < 0 || offset + 1 >= chunk.length) continue;
        const sample = chunk.readInt16LE(offset);
        const gain = (samplesToFade - 1 - s) / samplesToFade;
        chunk.writeInt16LE(Math.round(sample * gain), offset);
      }
    }
  }

  const finalChunks: Buffer[] = [];
  for (let i = 0; i < pcmChunks.length; i++) {
    finalChunks.push(pcmChunks[i]);
    if (i < pcmChunks.length - 1) {
      finalChunks.push(silenceBuffer);
    }
  }

  const totalPcmSize = finalChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + totalPcmSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(totalPcmSize, 40);

  return Buffer.concat([header, ...finalChunks]);
}

async function generateScriptAndAudio(params: {
  systemPrompt: string;
  userPrompt: string;
  voice: string;
  language: string;
  topicName: string;
  jobId: string;
  googleVoiceType?: VoiceType;
}): Promise<{ script: string; filename: string; durationSeconds: number; combinedAudio: Buffer }> {
  const job = generationJobs.get(params.jobId);

  if (job) job.progress = "Writing script...";
  console.log(`Generating script for "${params.topicName}"...`);

  const scriptResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [{ role: "user", content: params.userPrompt }],
    system: params.systemPrompt,
  });

  let rawScript = scriptResponse.content[0].type === "text" ? scriptResponse.content[0].text : "";

  rawScript = rawScript.replace(/^```(?:xml|ssml|html)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  console.log(`Script generated (${rawScript.length} chars). Generating audio...`);

  if (job) job.progress = "Generating audio...";

  const isChirp3 = params.googleVoiceType === "chirp3";
  const usesSsml = !isChirp3 && (params.googleVoiceType === "neural2" || params.googleVoiceType === "wavenet");
  const hasSsmlTags = rawScript.includes("<speak>") || rawScript.includes("<break") || rawScript.includes("<prosody");
  console.log(`Using Google TTS${isChirp3 ? " (Chirp 3: HD)" : usesSsml ? " (SSML)" : ""}`);

  const displayScript = isChirp3
    ? rawScript.replace(/\[pause short\]|\[pause long\]|\[pause\]/g, "").replace(/\[(fluisterend|enthousiast|verbaasd|peinzend|whispering|excited|surprised|thoughtful)\]/gi, "").replace(/ {2,}/g, " ").trim()
    : (usesSsml || hasSsmlTags) ? stripSsmlTags(rawScript) : rawScript;

  const scriptForAudio = (usesSsml || hasSsmlTags)
    ? rawScript.replace(/^<speak>\s*/i, "").replace(/\s*<\/speak>\s*$/i, "")
    : rawScript;

  const paragraphs = scriptForAudio.split(/\n\n+/).filter((p) => p.trim());
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > 800 && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  const ttsChunks = (usesSsml || hasSsmlTags)
    ? chunks.map((chunk) => `<speak>${chunk}</speak>`)
    : chunks;

  const audioBuffers: Buffer[] = [];
  for (let i = 0; i < ttsChunks.length; i++) {
    if (job) job.progress = `Generating audio (${i + 1}/${ttsChunks.length})...`;
    console.log(`  TTS chunk ${i + 1}/${ttsChunks.length}...`);
    try {
      const audio = await textToSpeech(ttsChunks[i], params.voice, params.language);
      if (audio.length > 44) {
        audioBuffers.push(audio);
      }
    } catch (err) {
      console.error(`  TTS chunk ${i + 1} failed:`, err);
      if (usesSsml || hasSsmlTags) {
        console.log(`  Retrying chunk ${i + 1} as plain text (SSML fallback)...`);
        try {
          const plainChunk = stripSsmlTags(ttsChunks[i]);
          const audio = await textToSpeech(plainChunk, params.voice, params.language);
          if (audio.length > 44) {
            audioBuffers.push(audio);
          }
        } catch (retryErr) {
          console.error(`  TTS chunk ${i + 1} plain-text retry also failed:`, retryErr);
        }
      }
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error("Audio generation failed");
  }

  const combinedAudio = await concatenateWavBuffers(audioBuffers);
  const id = generateId();
  const filename = `${id}.wav`;

  await uploadAudioToStorage(filename, combinedAudio);

  try {
    const localPath = path.join(AUDIO_DIR, filename);
    fs.writeFileSync(localPath, combinedAudio);
  } catch (e) {
    console.log("Local cache write skipped (non-critical)");
  }

  let durationSeconds = 0;
  if (combinedAudio.length >= 44) {
    const wavChannels = combinedAudio.readUInt16LE(22);
    const wavSampleRate = combinedAudio.readUInt32LE(24);
    const wavBitsPerSample = combinedAudio.readUInt16LE(34);
    const wavByteRate = wavSampleRate * wavChannels * (wavBitsPerSample / 8);
    const dataInfo = findDataChunk(combinedAudio);
    const pcmSize = dataInfo ? dataInfo.size : (combinedAudio.length - 44);
    durationSeconds = Math.round(pcmSize / wavByteRate);
  }

  console.log(`Podcast "${params.topicName}" ready (${(combinedAudio.length / 1024 / 1024).toFixed(1)} MB, ${durationSeconds}s)`);

  return { script: displayScript, filename, durationSeconds, combinedAudio };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/podcast/audio", express.static(AUDIO_DIR));

  app.get("/api/podcast/audio-stream/:filename", async (req: Request, res: Response) => {
    const filename = req.params.filename;
    if (!filename) {
      return res.status(400).json({ error: "Missing filename" });
    }

    const localPath = path.join(AUDIO_DIR, filename);
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }

    const streamed = await streamAudioFromStorage(filename, res);
    if (!streamed) {
      return res.status(404).json({ error: "Audio not found" });
    }
  });

  app.get("/api/podcast/job/:jobId", requireAuth, (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;
    const job = generationJobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    });
  });

  app.post("/api/podcast/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { topicId, topicName, topicNameNl, themeName, themeNameNl, perspective, voice, language, wordCount, lengthId } = req.body;
      const userId = (req as any).user?.id;

      if (!topicName || !voice || !language) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (userId && !checkRateLimit(userId)) {
        return res.status(429).json({ error: "Je hebt het maximum aantal podcasts per uur bereikt. Probeer het later opnieuw." });
      }

      const cacheAngle = perspective || "";
      const cacheLength = lengthId || "medium";

      if (topicId) {
        const [cached] = await db
          .select()
          .from(cachedPodcasts)
          .where(
            and(
              eq(cachedPodcasts.topicId, topicId),
              eq(cachedPodcasts.angle, cacheAngle),
              eq(cachedPodcasts.voice, voice),
              eq(cachedPodcasts.language, language),
              eq(cachedPodcasts.length, cacheLength)
            )
          );

        if (cached) {
          const audioPath = path.join(AUDIO_DIR, cached.audioFilename);
          const localExists = fs.existsSync(audioPath);
          const storageExists = !localExists ? await audioExistsInStorage(cached.audioFilename) : false;
          if (localExists || storageExists) {
            console.log(`Cache hit for "${topicName}" [${cacheAngle || "no angle"}/${voice}/${language}/${cacheLength}]`);

            if (userId) {
              try {
                await db.insert(userPodcasts).values({
                  userId,
                  cachedPodcastId: cached.id,
                  topicName: topicName || "",
                  topicNameNl: topicNameNl || topicName || "",
                  themeName: themeName || "",
                  themeNameNl: themeNameNl || themeName || "",
                }).onConflictDoNothing();
              } catch (e) {
                console.error("Failed to save user-podcast link:", e);
              }
            }

            return res.json({
              status: "ready",
              result: {
                id: cached.id,
                script: cached.script,
                audioUrl: `/api/podcast/audio-stream/${cached.audioFilename}`,
                durationSeconds: cached.durationSeconds,
                cached: true,
              },
            });
          }
        }
      }

      const jobId = generateId();
      generationJobs.set(jobId, {
        status: "generating",
        progress: "Starting...",
        createdAt: Date.now(),
      });

      res.json({ jobId, status: "generating" });

      const googleVoiceType = getGoogleVoiceType(voice, language);
      const siblingAngles = getSiblingAngles(topicId, perspective, language);
      const systemPrompt = getSystemPrompt(language, perspective, wordCount || 750, googleVoiceType, siblingAngles);
      const userPrompt = language === "nl"
        ? `Schrijf een podcast over: ${topicName} (thema: ${themeName} in Parijs)`
        : `Write a podcast about: ${topicName} (theme: ${themeName} in Paris)`;

      generateScriptAndAudio({
        systemPrompt,
        userPrompt,
        voice,
        language,
        topicName,
        jobId,
        googleVoiceType,
      }).then(async ({ script, filename, durationSeconds }) => {
        let cachedId = jobId;
        if (topicId) {
          try {
            const [inserted] = await db.insert(cachedPodcasts).values({
              topicId,
              angle: cacheAngle,
              voice,
              language,
              length: cacheLength,
              script,
              audioFilename: filename,
              durationSeconds,
            }).returning();
            cachedId = inserted.id;
            console.log(`Cached podcast for "${topicName}"`);
          } catch (cacheErr) {
            console.error("Failed to cache podcast:", cacheErr);
          }
        }

        if (userId && topicId) {
          try {
            await db.insert(userPodcasts).values({
              userId,
              cachedPodcastId: cachedId,
              topicName: topicName || "",
              topicNameNl: topicNameNl || topicName || "",
              themeName: themeName || "",
              themeNameNl: themeNameNl || themeName || "",
            }).onConflictDoNothing();
          } catch (e) {
            console.error("Failed to save user-podcast link:", e);
          }
        }

        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "ready";
          job.result = {
            id: cachedId,
            script,
            audioUrl: `/api/podcast/audio-stream/${filename}`,
            durationSeconds,
            cached: false,
          };
        }
      }).catch((error) => {
        console.error("Error generating podcast:", error);
        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "error";
          job.error = "Failed to generate podcast";
        }
      });
    } catch (error) {
      console.error("Error starting podcast generation:", error);
      res.status(500).json({ error: "Failed to start podcast generation" });
    }
  });

  app.post("/api/podcast/generate-custom", requireAuth, async (req: Request, res: Response) => {
    try {
      const { subject, angle, voice, language, wordCount, lengthId } = req.body;
      const userId = (req as any).user?.id;

      if (!subject || !angle || !voice || !language || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const MAX_FREE_CUSTOM_PODCASTS = 5;
      const [{ value: customCount }] = await db.select({ value: count() })
        .from(customPodcasts)
        .where(eq(customPodcasts.userId, userId));
      if (customCount >= MAX_FREE_CUSTOM_PODCASTS) {
        return res.status(403).json({
          error: "You have reached the maximum of 5 free custom podcasts.",
          code: "CUSTOM_LIMIT_REACHED",
          customCount,
          customLimit: MAX_FREE_CUSTOM_PODCASTS,
        });
      }

      try {
        const moderationResponse = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 20,
          messages: [{
            role: "user",
            content: `You are a content moderator. Determine if the following podcast topic is appropriate for a general audience. The topic should be related to Paris, France, travel, culture, history, food, or similar subjects. Reject topics that are: sexually explicit, promoting violence or hate, about illegal activities, about weapons or drugs, or completely unrelated to Paris/France.\n\nTopic: "${subject}"\n\nRespond with ONLY "ALLOW" or "REJECT".`,
          }],
        });
        const moderationResult = (moderationResponse.content[0] as any)?.text?.trim().toUpperCase();
        if (moderationResult !== "ALLOW") {
          return res.status(400).json({ error: "This topic is not suitable for Paris Stories. Please choose a topic related to Paris, its culture, history, or daily life." });
        }
      } catch (modErr) {
        console.error("Content moderation check failed:", modErr);
        return res.status(500).json({ error: "Unable to verify your topic right now. Please try again in a moment." });
      }

      const customAngleMap: Record<string, { en: string; nl: string }> = {
        historical: {
          en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context. Weave the facts into a compelling narrative rather than a dry summary.",
          nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op. Weef de feiten in een meeslepend verhaal, geen droge samenvatting.",
        },
        "modern-culture": {
          en: "Focus on contemporary culture, modern-day significance, current trends, and how this topic connects to life in Paris today.",
          nl: "Focus op hedendaagse cultuur, de moderne betekenis, huidige trends en hoe dit onderwerp aansluit bij het leven in Parijs vandaag.",
        },
        "personal-stories": {
          en: "Tell personal, intimate stories. Use anecdotes, first-person perspectives, and emotional storytelling to bring this topic to life through the eyes of real people.",
          nl: "Vertel persoonlijke, intieme verhalen. Gebruik anekdotes, eerstepersoonperspectieven en emotioneel vertellen om dit onderwerp tot leven te brengen door de ogen van echte mensen.",
        },
      };

      const angleText = customAngleMap[angle]?.[language === "nl" ? "nl" : "en"] || customAngleMap["historical"][language === "nl" ? "nl" : "en"];

      const customGoogleVoiceType = getGoogleVoiceType(voice, language);

      const customAngleNames: Record<string, Record<string, string>> = {
        historical: { en: "Historical", nl: "Historisch", fr: "Historique", de: "Historisch", es: "Histórico" },
        "modern-culture": { en: "Modern Culture", nl: "Hedendaagse Cultuur", fr: "Culture moderne", de: "Moderne Kultur", es: "Cultura moderna" },
        "personal-stories": { en: "Personal Stories", nl: "Persoonlijke Verhalen", fr: "Histoires personnelles", de: "Persönliche Geschichten", es: "Historias personales" },
      };
      const customAngleDescriptions: Record<string, Record<string, string>> = {
        historical: { en: "Facts, dates, and chronological storytelling", nl: "Feiten, data en chronologisch vertellen", fr: "Faits, dates et récit chronologique", de: "Fakten, Daten und chronologisches Erzählen", es: "Hechos, fechas y narración cronológica" },
        "modern-culture": { en: "Contemporary culture, modern-day significance, and current trends", nl: "Hedendaagse cultuur, moderne betekenis en huidige trends", fr: "Culture contemporaine, signification moderne et tendances actuelles", de: "Zeitgenössische Kultur, moderne Bedeutung und aktuelle Trends", es: "Cultura contemporánea, importancia moderna y tendencias actuales" },
        "personal-stories": { en: "Personal, intimate stories through the eyes of real people", nl: "Persoonlijke, intieme verhalen door de ogen van echte mensen", fr: "Histoires personnelles et intimes à travers les yeux de vraies personnes", de: "Persönliche, intime Geschichten durch die Augen echter Menschen", es: "Historias personales e íntimas a través de los ojos de personas reales" },
      };
      const customLangKey = getLanguageKey(language);
      const customSiblingAngles: SiblingAngle[] = Object.keys(customAngleMap)
        .filter(a => a !== angle)
        .map(a => ({
          name: customAngleNames[a]?.[customLangKey] || customAngleNames[a]?.en || a,
          description: customAngleDescriptions[a]?.[customLangKey] || customAngleDescriptions[a]?.en || "",
        }));
      const customFocusGuidance = buildFocusGuidance(customSiblingAngles, language);

      const systemPrompt = (language === "nl"
        ? `## Jouw Rol
Je bent een deskundige solo-podcastverteller. Je bent een ervaren gids die met de luisteraar door Parijs wandelt. Je vertelstijl is warm maar nuchter. Je deelt feiten en achtergronden op een toegankelijke, ontspannen manier. Je schrijft in vloeiend, natuurlijk Nederlands.

## Perspectief
${angleText}

## Toon
Houd de toon informatief en nuchter, met af en toe een persoonlijke noot. Vermijd overdreven dramatiek, poetische overdrijvingen en theatrale effecten. Wees eerder een goede vriend die iets interessants vertelt dan een acteur die een rol speelt. Laat de feiten voor zich spreken.

## Audio-optimalisatie (voor TTS)
Om natuurlijk te klinken, hanteer je deze regels:
1. **Geen afkortingen:** Schrijf altijd voluit. Gebruik "het" in plaats van "'t", "er" in plaats van "d'r", "mijn" in plaats van "m'n", "een" in plaats van "'n". Geen samentrekkingen.
2. **Geen streepjes of drie puntjes:** Gebruik GEEN liggende streepjes (—), GEEN drie puntjes (...). Gebruik gewone komma's en punten voor ritme en pauzes.
3. **Geen stopwoordjes:** Vermijd vulwoorden als "Tja,", "Kijk,", "Hè,", "Hoor je dat?", "Weet je wat?", "Echt waar,". Vertel gewoon het verhaal zonder dit soort opvulling.
4. **Zinsopbouw:** Wissel korte en langere zinnen af. Vermijd ingewikkelde bijzinnen.
5. **Fonetisch helder:** Schrijf woorden die goed uitspreekbaar zijn voor text-to-speech. Vermijd moeilijke woordcombinaties, tongbrekers en ongebruikelijke leenwoorden. Gebruik eenvoudige, heldere Nederlandse woorden.
6. **Concreet:** Noem specifieke namen, data, adressen en feiten. Dat maakt het verhaal geloofwaardig en informatief.

## Schrijfregels
- GEEN titels, GEEN "Welkom bij...", GEEN introductie van jezelf.
- Begin direct met het onderwerp, geen omslachtige inleiding.
- Schrijf in vloeiende alinea's zonder koppen of opsommingstekens.
- Gebruik 'je' en 'jij' om een directe band met de luisteraar op te bouwen.
- Lengte: schrijf ongeveer ${wordCount || 400} woorden.
- Eindig met een interessant feit of een gedachte die blijft hangen.${customGoogleVoiceType ? getGoogleTtsInstructions("nl", customGoogleVoiceType) : ""}`
        : `## Your Role
You are a knowledgeable solo podcast storyteller. You are an experienced guide walking through Paris with the listener. Your style is warm but grounded. You share facts and context in an accessible, relaxed way. You write in fluent, natural English.

## Perspective
${angleText}

## Tone
Keep the tone informative and down-to-earth, with occasional personal touches. Avoid excessive drama, poetic exaggeration, and theatrical effects. Be more like a good friend sharing something interesting than an actor performing a role. Let the facts speak for themselves.

## Audio Optimization (for TTS)
To sound natural, follow these rules:
1. **No abbreviations:** Write words out in full. Use "it is" instead of "it's", "they would" instead of "they'd", "do not" instead of "don't". No contractions.
2. **No dashes or ellipses:** Do NOT use em dashes, en dashes, or ellipses. Use commas and periods for rhythm and pauses.
3. **No filler words:** Avoid filler words like "Well,", "Look,", "You know what?", "Honestly,", "Hear that?". Just tell the story without filler.
4. **Sentence structure:** Alternate short and longer sentences. Avoid complex subordinate clauses.
5. **Phonetically clear:** Write words that are easy to pronounce for text-to-speech. Avoid difficult word combinations, tongue twisters, and unusual loanwords. Use simple, clear words.
6. **Be specific:** Mention specific names, dates, addresses, and facts. This makes the story credible and informative.

## Writing Rules
- NO titles, NO "Welcome to...", NO introducing yourself.
- Start directly with the topic, no lengthy introduction.
- Write in flowing paragraphs without headings or bullet points.
- Use 'you' to build a direct connection with the listener.
- Length: write approximately ${wordCount || 400} words.
- End with an interesting fact or a thought that lingers.${customGoogleVoiceType ? getGoogleTtsInstructions("en", customGoogleVoiceType) : ""}`) + customFocusGuidance;

      const userPrompt = language === "nl"
        ? `Schrijf een podcast over: ${subject} (in de context van Parijs)`
        : `Write a podcast about: ${subject} (in the context of Paris)`;

      const jobId = generateId();
      generationJobs.set(jobId, {
        status: "generating",
        progress: "Starting...",
        createdAt: Date.now(),
      });

      console.log(`Generating custom podcast for user ${userId}: "${subject}" [${angle}/${voice}/${language}]...`);

      res.json({ jobId, status: "generating" });

      generateScriptAndAudio({
        systemPrompt,
        userPrompt,
        voice,
        language,
        topicName: subject,
        jobId,
        googleVoiceType: customGoogleVoiceType,
      }).then(async ({ script, filename, durationSeconds }) => {
        let finalFilename = filename;

        try {
          const customFilename = `custom_${filename}`;
          const bucketName = getAudioBucketName();
          const bucket = objectStorageClient.bucket(bucketName);
          const oldFile = bucket.file(`podcast-audio/${filename}`);
          const [exists] = await oldFile.exists();
          if (exists) {
            const [content] = await oldFile.download();
            const newFile = bucket.file(`podcast-audio/${customFilename}`);
            await newFile.save(content, { contentType: "audio/wav", resumable: false });
            await oldFile.delete();
            finalFilename = customFilename;
          }

          const oldPath = path.join(AUDIO_DIR, filename);
          const newPath = path.join(AUDIO_DIR, customFilename);
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
          }
        } catch (renameErr) {
          console.error("Failed to rename audio, using original filename:", renameErr);
        }

        let generatedTitle = subject;
        try {
          const titlePrompts: Record<string, string> = {
            nl: `Genereer een korte, pakkende podcast titel (maximaal 6 woorden) voor een podcast over: "${subject}". Geef ALLEEN de titel terug, zonder aanhalingstekens, zonder uitleg.`,
            en: `Generate a short, catchy podcast title (maximum 6 words) for a podcast about: "${subject}". Return ONLY the title, no quotes, no explanation.`,
            fr: `Génère un titre de podcast court et accrocheur (maximum 6 mots) pour un podcast sur : "${subject}". Retourne UNIQUEMENT le titre, sans guillemets, sans explication.`,
            de: `Erstelle einen kurzen, einprägsamen Podcast-Titel (maximal 6 Wörter) für einen Podcast über: "${subject}". Gib NUR den Titel zurück, ohne Anführungszeichen, ohne Erklärung.`,
          };
          const titlePrompt = titlePrompts[language] || titlePrompts.en;

          const titleResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 50,
            messages: [{ role: "user", content: titlePrompt }],
          });

          const titleText = (titleResponse.content[0] as any)?.text?.trim().replace(/^["'""]|["'""]$/g, "");
          if (titleText && titleText.length > 0 && titleText.length <= 80) {
            generatedTitle = titleText;
          }
        } catch (titleErr) {
          console.error("Failed to generate title, using subject:", titleErr);
        }

        const id = generateId();
        const [saved] = await db.insert(customPodcasts).values({
          id,
          userId,
          subject,
          title: generatedTitle,
          angle,
          voice,
          language,
          length: lengthId || "short",
          script,
          audioFilename: finalFilename,
          durationSeconds,
        }).returning();

        console.log(`Custom podcast "${generatedTitle}" ready for user ${userId} (${durationSeconds}s)`);

        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "ready";
          job.result = {
            id: saved.id,
            title: saved.title,
            subject: saved.subject,
            script: saved.script,
            audioUrl: `/api/podcast/audio-stream/${saved.audioFilename}`,
            durationSeconds: saved.durationSeconds,
            angle: saved.angle,
            voice: saved.voice,
            language: saved.language,
            length: saved.length,
            createdAt: saved.createdAt?.toISOString(),
            customDbId: saved.id,
            cached: false,
          };
        }
      }).catch((error) => {
        console.error("Error generating custom podcast:", error);
        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "error";
          job.error = "Failed to generate custom podcast";
        }
      });
    } catch (error) {
      console.error("Error starting custom podcast generation:", error);
      res.status(500).json({ error: "Failed to start custom podcast generation" });
    }
  });

  app.get("/api/podcast/custom-limit", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const MAX_FREE_CUSTOM_PODCASTS = 5;
      const [{ value: customCount }] = await db.select({ value: count() })
        .from(customPodcasts)
        .where(eq(customPodcasts.userId, userId));

      res.json({
        customCount,
        customLimit: MAX_FREE_CUSTOM_PODCASTS,
        remaining: Math.max(0, MAX_FREE_CUSTOM_PODCASTS - customCount),
      });
    } catch (error) {
      console.error("Error fetching custom limit:", error);
      res.status(500).json({ error: "Failed to fetch custom podcast limit" });
    }
  });

  app.get("/api/podcast/custom", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const results = await db
        .select()
        .from(customPodcasts)
        .where(eq(customPodcasts.userId, userId))
        .orderBy(desc(customPodcasts.createdAt));

      const needsTitle = results.filter((p) => !p.title || p.title === p.subject);
      const toRegenerate = needsTitle.slice(0, 3);

      for (const p of toRegenerate) {
        try {
          const titlePrompts: Record<string, string> = {
            nl: `Genereer een korte, pakkende podcast titel (maximaal 6 woorden) voor een podcast over: "${p.subject}". Geef ALLEEN de titel terug, zonder aanhalingstekens, zonder uitleg.`,
            en: `Generate a short, catchy podcast title (maximum 6 words) for a podcast about: "${p.subject}". Return ONLY the title, no quotes, no explanation.`,
            fr: `Génère un titre de podcast court et accrocheur (maximum 6 mots) pour un podcast sur : "${p.subject}". Retourne UNIQUEMENT le titre, sans guillemets, sans explication.`,
            de: `Erstelle einen kurzen, einprägsamen Podcast-Titel (maximal 6 Wörter) für einen Podcast über: "${p.subject}". Gib NUR den Titel zurück, ohne Anführungszeichen, ohne Erklärung.`,
          };
          const titlePrompt = titlePrompts[p.language] || titlePrompts.en;
          const titleResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-5",
            max_tokens: 50,
            messages: [{ role: "user", content: titlePrompt }],
          });
          const titleText = (titleResponse.content[0] as any)?.text?.trim().replace(/^["'""]|["'""]$/g, "");
          if (titleText && titleText.length > 0 && titleText.length <= 80) {
            p.title = titleText;
          } else {
            p.title = p.subject.length > 60 ? p.subject.substring(0, 57) + "..." : p.subject;
          }
          await db.update(customPodcasts).set({ title: p.title }).where(eq(customPodcasts.id, p.id));
        } catch {
          p.title = p.subject.length > 60 ? p.subject.substring(0, 57) + "..." : p.subject;
          await db.update(customPodcasts).set({ title: p.title }).where(eq(customPodcasts.id, p.id)).catch(() => {});
        }
      }

      const podcasts = results.map((p) => ({
        id: p.id,
        title: p.title || p.subject,
        subject: p.subject,
        script: p.script,
        audioUrl: `/api/podcast/audio-stream/${p.audioFilename}`,
        durationSeconds: p.durationSeconds,
        angle: p.angle,
        voice: p.voice,
        language: p.language,
        length: p.length,
        createdAt: p.createdAt,
      }));

      res.json({ podcasts });
    } catch (error) {
      console.error("Error fetching custom podcasts:", error);
      res.status(500).json({ error: "Failed to fetch custom podcasts" });
    }
  });

  app.get("/api/podcast/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      const genericResults = await db
        .select({
          userPodcast: userPodcasts,
          cached: cachedPodcasts,
        })
        .from(userPodcasts)
        .innerJoin(cachedPodcasts, eq(userPodcasts.cachedPodcastId, cachedPodcasts.id))
        .where(eq(userPodcasts.userId, userId))
        .orderBy(desc(userPodcasts.createdAt));

      const genericPodcasts = genericResults
        .map((r) => ({
          id: r.cached.id,
          title: r.userPodcast.topicName,
          titleNl: r.userPodcast.topicNameNl,
          theme: r.userPodcast.themeName,
          themeNl: r.userPodcast.themeNameNl,
          script: r.cached.script,
          audioUrl: `/api/podcast/audio-stream/${r.cached.audioFilename}`,
          durationSeconds: r.cached.durationSeconds,
          voice: r.cached.voice,
          language: r.cached.language,
          perspective: r.cached.angle,
          length: r.cached.length,
          createdAt: r.userPodcast.createdAt?.toISOString() || new Date().toISOString(),
          isCustom: false,
        }));

      const customResults = await db
        .select()
        .from(customPodcasts)
        .where(eq(customPodcasts.userId, userId))
        .orderBy(desc(customPodcasts.createdAt));

      const customPodcastsList = customResults
        .map((p) => ({
          id: p.id,
          title: p.title || p.subject,
          titleNl: p.title || p.subject,
          subject: p.subject,
          theme: "Custom",
          themeNl: "Eigen",
          script: p.script,
          audioUrl: `/api/podcast/audio-stream/${p.audioFilename}`,
          durationSeconds: p.durationSeconds,
          voice: p.voice,
          language: p.language,
          perspective: p.angle,
          length: p.length,
          createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
          isCustom: true,
          customDbId: p.id,
        }));

      const allPodcasts = [...genericPodcasts, ...customPodcastsList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({ podcasts: allPodcasts });
    } catch (error) {
      console.error("Error fetching podcast history:", error);
      res.status(500).json({ error: "Failed to fetch podcast history" });
    }
  });

  app.delete("/api/podcast/custom/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const podcastId = req.params.id;

      const [podcast] = await db
        .select()
        .from(customPodcasts)
        .where(and(eq(customPodcasts.id, podcastId), eq(customPodcasts.userId, userId)));

      if (!podcast) {
        return res.status(404).json({ error: "Podcast not found" });
      }

      const audioPath = path.join(AUDIO_DIR, podcast.audioFilename);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      await deleteAudioFromStorage(podcast.audioFilename);

      await db.delete(customPodcasts).where(eq(customPodcasts.id, podcastId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom podcast:", error);
      res.status(500).json({ error: "Failed to delete custom podcast" });
    }
  });

  app.get("/privacy-policy", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy - Paris Stories</title>
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
<h1>Privacy Policy</h1>
<p class="date">Last updated: February 20, 2026</p>

<p>Paris Stories ("we", "our", or "the app") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.</p>

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
<p>Paris Stories uses artificial intelligence to create podcast scripts. When you request a podcast, your chosen topic is sent to <strong>Anthropic Claude</strong>, a third-party AI service, which generates the script. The generated script is then converted to audio using <strong>Google Cloud Text-to-Speech</strong>.</p>
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
<li><strong>Contact us:</strong> For any privacy-related questions, contact us at vragen@greenhome.nl.</li>
</ul>

<h2>7. Children's Privacy</h2>
<p>Paris Stories is not intended for children under 13. We do not knowingly collect data from children.</p>

<h2>8. Changes to This Policy</h2>
<p>We may update this policy from time to time. We will notify users of significant changes through the app.</p>
</div>
</body>
</html>`);
  });

  const httpServer = createServer(app);
  return httpServer;
}
