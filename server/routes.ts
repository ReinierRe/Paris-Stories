import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { textToSpeech } from "./tts";
import { getGoogleVoiceType, type VoiceType } from "./google-tts";
import { requireAuth } from "./auth";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { eq, and } from "drizzle-orm";
import { db } from "./storage";
import { cachedPodcasts, customPodcasts, userPodcasts } from "@shared/schema";
import { desc } from "drizzle-orm";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL!,
});

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
  if (language === "nl") {
    return `

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
- Gebruik GEEN markdown-opmaak of koppen.`;
  }
  return `

## Writing Style for Speech (MANDATORY)
The audio will be generated with Google Chirp 3: HD. Write in plain text, no formatting.

Rules:
1. **Plain text:** Write ordinary text. Do NOT use SSML tags (\`<speak>\`, \`<break>\`, \`<prosody>\`), NO pause markers (\`[pause short]\`, \`[pause long]\`), and NO emotional cues (\`[whispering]\` etc.).
2. **No abbreviations:** Write words out in full. Use "it is" instead of "it's", "they would" instead of "they'd", "do not" instead of "don't". No contractions.
3. **No filler words:** Avoid words like "Well,", "Look,", "You know what?", "Honestly,". Just tell the story without filler.
4. **No dashes or ellipses:** Do NOT use em dashes (—), en dashes (–), or ellipses (...). Use commas and periods for rhythm and pauses.
5. **Phonetically clear:** Write words that are easy to pronounce for text-to-speech. Avoid difficult word combinations, tongue twisters, and unusual loanwords. Use simple, clear words.

IMPORTANT:
- Write in plain text, NO SSML tags, NO markers in brackets.
- Do NOT use markdown formatting or headings.`;
}

function getSsmlInstructions(language: string): string {
  if (language === "nl") {
    return `

## SSML-opmaak (VERPLICHT)
De audio wordt gegenereerd met Google Neural2. Je MOET het volledige script in SSML-formaat schrijven om natuurlijke spraak te bereiken.

Omsluit het hele script met \`<speak>\` tags. Gebruik deze SSML-tags door het hele script:
- \`<break time="300ms"/>\` tot \`<break time="800ms"/>\` voor natuurlijke adempauzes en dramatische stiltes
- \`<prosody rate="90%">...</prosody>\` om belangrijke passages langzamer voor te lezen
- \`<prosody rate="105%">...</prosody>\` om energieke passages iets sneller voor te lezen
- \`<emphasis level="strong">...</emphasis>\` voor woorden die eruit moeten springen

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
- Gebruik ALLEEN de tags uit de bovenstaande lijst (\`<break>\`, \`<prosody>\`, \`<emphasis>\`). Geen andere SSML-tags.`;
  }
  return `

## SSML Formatting (MANDATORY)
The audio will be generated with Google Neural2. You MUST write the entire script in SSML format to achieve natural speech.

Wrap the entire script in \`<speak>\` tags. Use these SSML tags throughout the script:
- \`<break time="300ms"/>\` to \`<break time="800ms"/>\` for natural breathing pauses and dramatic silences
- \`<prosody rate="90%">...</prosody>\` to slow down important passages
- \`<prosody rate="105%">...</prosody>\` to slightly speed up energetic passages
- \`<emphasis level="strong">...</emphasis>\` for words that need to stand out

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

function getSystemPrompt(language: string, perspective: string, wordCount: number, googleVoiceType?: VoiceType): string {
  const perspectiveMap: Record<string, { en: string; nl: string }> = {
    historical: {
      en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context. Weave the facts into a compelling narrative rather than a dry summary.",
      nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op. Weef de feiten in een meeslepend verhaal, geen droge samenvatting.",
    },
    "iconic-figures": {
      en: "Focus on the key personalities and iconic figures central to this story. Bring them to life with vivid character details, their motivations, rivalries, and the human drama behind the events.",
      nl: "Focus op de belangrijkste persoonlijkheden en iconische figuren in dit verhaal. Breng ze tot leven met levendige karakterdetails, hun motivaties, rivaliteiten en het menselijke drama achter de gebeurtenissen.",
    },
    origin: {
      en: "Tell the founding story of this place or museum. How did it come to be? What vision drove its creation? Cover the key moments from its origins to what it is today.",
      nl: "Vertel het ontstaansverhaal van deze plek of dit museum. Hoe is het tot stand gekomen? Welke visie dreef de oprichting? Behandel de belangrijkste momenten van het ontstaan tot wat het nu is.",
    },
    "prominent-art": {
      en: "Focus on the most famous and significant artworks in the collection. Tell the stories behind the masterpieces \u2014 who created them, why, and what makes them extraordinary.",
      nl: "Focus op de beroemdste en belangrijkste kunstwerken in de collectie. Vertel de verhalen achter de meesterwerken \u2014 wie ze maakte, waarom, en wat ze buitengewoon maakt.",
    },
    architecture: {
      en: "Focus on the architecture and the building itself. Describe its design, the architect's vision, the construction story, and the architectural details that make it remarkable.",
      nl: "Focus op de architectuur en het gebouw zelf. Beschrijf het ontwerp, de visie van de architect, het bouwverhaal en de architectonische details die het bijzonder maken.",
    },
    cultural: {
      en: "Focus on art, food, lifestyle, and cultural significance. Explore how culture shaped and was shaped by this topic.",
      nl: "Focus op kunst, eten, levensstijl en culturele betekenis. Verken hoe cultuur dit onderwerp vormde en erdoor werd gevormd.",
    },
    "modern-times": {
      en: "Tell the story of how this place looks and feels today. What has changed in recent decades? How does modern life play out here? Capture the contemporary atmosphere.",
      nl: "Vertel het verhaal van hoe deze plek er vandaag uitziet en aanvoelt. Wat is er de afgelopen decennia veranderd? Hoe speelt het moderne leven zich hier af? Vang de hedendaagse sfeer.",
    },
    "walking-tour": {
      en: "Guide the listener as if walking through Paris together. Describe what they would see, hear, and smell. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.",
      nl: "Begeleid de luisteraar alsof je samen door Parijs wandelt. Beschrijf wat ze zouden zien, horen en ruiken. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details.",
    },
  };

  const defaultStyle = {
    en: "Tell an engaging, well-rounded story covering the most interesting aspects of this topic.",
    nl: "Vertel een boeiend, veelzijdig verhaal dat de meest interessante aspecten van dit onderwerp behandelt.",
  };
  const perspectiveText = perspective
    ? (perspectiveMap[perspective]?.[language === "nl" ? "nl" : "en"] || defaultStyle[language === "nl" ? "nl" : "en"])
    : defaultStyle[language === "nl" ? "nl" : "en"];

  if (language === "nl") {
    return `## Jouw Rol
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
- Eindig met een interessant feit of een gedachte die blijft hangen.${googleVoiceType ? getGoogleTtsInstructions("nl", googleVoiceType) : ""}`;
  }

  return `## Your Role
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
- End with an interesting fact or a thought that lingers.${googleVoiceType ? getGoogleTtsInstructions("en", googleVoiceType) : ""}`;
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

  const rawScript = scriptResponse.content[0].type === "text" ? scriptResponse.content[0].text : "";
  console.log(`Script generated (${rawScript.length} chars). Generating audio...`);

  if (job) job.progress = "Generating audio...";

  const isChirp3 = params.googleVoiceType === "chirp3";
  const isSsml = !isChirp3 && rawScript.trim().startsWith("<speak>");
  console.log(`Using Google TTS${isChirp3 ? " (Chirp 3: HD)" : isSsml ? " (SSML)" : ""}`);

  const displayScript = isChirp3
    ? rawScript.replace(/\[pause short\]|\[pause long\]|\[pause\]/g, "").replace(/\[(fluisterend|enthousiast|verbaasd|peinzend|whispering|excited|surprised|thoughtful)\]/gi, "").replace(/ {2,}/g, " ").trim()
    : isSsml ? stripSsmlTags(rawScript) : rawScript;

  const scriptForAudio = isSsml
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

  const ttsChunks = isSsml
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
      if (isSsml) {
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
      const systemPrompt = getSystemPrompt(language, perspective, wordCount || 750, googleVoiceType);
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

      const systemPrompt = language === "nl"
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
- End with an interesting fact or a thought that lingers.${customGoogleVoiceType ? getGoogleTtsInstructions("en", customGoogleVoiceType) : ""}`;

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
          const titlePrompt = language === "nl"
            ? `Genereer een korte, pakkende podcast titel (maximaal 6 woorden) voor een podcast over: "${subject}". Geef ALLEEN de titel terug, zonder aanhalingstekens, zonder uitleg.`
            : `Generate a short, catchy podcast title (maximum 6 words) for a podcast about: "${subject}". Return ONLY the title, no quotes, no explanation.`;

          const titleResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 50,
            messages: [{ role: "user", content: titlePrompt }],
          });

          const titleText = (titleResponse.content[0] as any)?.text?.trim();
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

  app.get("/api/podcast/custom", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const results = await db
        .select()
        .from(customPodcasts)
        .where(eq(customPodcasts.userId, userId))
        .orderBy(desc(customPodcasts.createdAt));

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

  const httpServer = createServer(app);
  return httpServer;
}
