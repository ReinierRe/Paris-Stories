var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cachedPodcasts: () => cachedPodcasts,
  customPodcasts: () => customPodcasts,
  insertUserSchema: () => insertUserSchema,
  userPodcasts: () => userPodcasts,
  users: () => users
});
import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, insertUserSchema, cachedPodcasts, customPodcasts, userPodcasts;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: text("email").notNull().unique(),
      password: text("password"),
      firstName: text("first_name"),
      firebaseUid: text("firebase_uid").unique(),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).pick({
      email: true,
      password: true,
      firstName: true,
      firebaseUid: true
    });
    cachedPodcasts = pgTable("cached_podcasts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      topicId: text("topic_id").notNull(),
      angle: text("angle").notNull().default(""),
      voice: text("voice").notNull(),
      language: text("language").notNull(),
      length: text("length").notNull(),
      script: text("script").notNull(),
      audioFilename: text("audio_filename").notNull(),
      durationSeconds: integer("duration_seconds").notNull().default(0),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      uniqueIndex("cached_podcast_lookup_idx").on(
        table.topicId,
        table.angle,
        table.voice,
        table.language,
        table.length
      )
    ]);
    customPodcasts = pgTable("custom_podcasts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: text("user_id").notNull(),
      subject: text("subject").notNull(),
      angle: text("angle").notNull(),
      voice: text("voice").notNull(),
      language: text("language").notNull(),
      length: text("length").notNull(),
      script: text("script").notNull(),
      audioFilename: text("audio_filename").notNull(),
      durationSeconds: integer("duration_seconds").notNull().default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    userPodcasts = pgTable("user_podcasts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: text("user_id").notNull(),
      cachedPodcastId: text("cached_podcast_id").notNull(),
      topicName: text("topic_name").notNull(),
      topicNameNl: text("topic_name_nl").notNull().default(""),
      themeName: text("theme_name").notNull(),
      themeNameNl: text("theme_name_nl").notNull().default(""),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => [
      uniqueIndex("user_podcast_lookup_idx").on(
        table.userId,
        table.cachedPodcastId
      )
    ]);
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  createFirebaseUser: () => createFirebaseUser,
  createUser: () => createUser,
  db: () => db,
  getUser: () => getUser,
  getUserByEmail: () => getUserByEmail,
  getUserByFirebaseUid: () => getUserByFirebaseUid
});
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
async function getUser(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}
async function getUserByEmail(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}
async function createUser(email, hashedPassword, firstName) {
  const [user] = await db.insert(users).values({ email, password: hashedPassword, firstName: firstName || null }).returning();
  return user;
}
async function getUserByFirebaseUid(uid) {
  const [user] = await db.select().from(users).where(eq(users.firebaseUid, uid));
  return user;
}
async function createFirebaseUser(email, firebaseUid, firstName) {
  const [user] = await db.insert(users).values({ email, firebaseUid, firstName: firstName || null }).returning();
  return user;
}
var db;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    db = drizzle(process.env.DATABASE_URL);
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "node:http";
import Anthropic from "@anthropic-ai/sdk";

// server/google-tts.ts
import { Buffer as Buffer2 } from "node:buffer";
var GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
var SAMPLE_RATE = 24e3;
var NUM_CHANNELS = 1;
var BITS_PER_SAMPLE = 16;
var LANGUAGE_VOICES = {
  nl: {
    male: { languageCode: "nl-NL", name: "nl-NL-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "nl-NL", name: "nl-NL-Wavenet-A", ssmlGender: "FEMALE" }
  },
  en: {
    male: { languageCode: "en-US", name: "en-US-Wavenet-D", ssmlGender: "MALE" },
    female: { languageCode: "en-US", name: "en-US-Wavenet-F", ssmlGender: "FEMALE" }
  },
  fr: {
    male: { languageCode: "fr-FR", name: "fr-FR-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "fr-FR", name: "fr-FR-Wavenet-A", ssmlGender: "FEMALE" }
  },
  es: {
    male: { languageCode: "es-ES", name: "es-ES-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "es-ES", name: "es-ES-Wavenet-A", ssmlGender: "FEMALE" }
  },
  de: {
    male: { languageCode: "de-DE", name: "de-DE-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "de-DE", name: "de-DE-Wavenet-A", ssmlGender: "FEMALE" }
  },
  it: {
    male: { languageCode: "it-IT", name: "it-IT-Wavenet-C", ssmlGender: "MALE" },
    female: { languageCode: "it-IT", name: "it-IT-Wavenet-A", ssmlGender: "FEMALE" }
  },
  pt: {
    male: { languageCode: "pt-BR", name: "pt-BR-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "pt-BR", name: "pt-BR-Wavenet-A", ssmlGender: "FEMALE" }
  },
  ja: {
    male: { languageCode: "ja-JP", name: "ja-JP-Wavenet-C", ssmlGender: "MALE" },
    female: { languageCode: "ja-JP", name: "ja-JP-Wavenet-A", ssmlGender: "FEMALE" }
  },
  zh: {
    male: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-A", ssmlGender: "FEMALE" }
  }
};
function getGoogleVoice(voicePref, language = "nl") {
  const lang = language.toLowerCase();
  const langVoices = LANGUAGE_VOICES[lang];
  if (!langVoices) {
    console.warn(`Unknown language "${language}" for Google TTS, defaulting to Dutch (nl)`);
  }
  const voices = langVoices || LANGUAGE_VOICES["nl"];
  if (voicePref === "male") return voices.male;
  return voices.female;
}
function wrapPcmInWav(pcmData) {
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;
  const header = Buffer2.alloc(headerSize);
  header.write("RIFF", 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(NUM_CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer2.concat([header, pcmData]);
}
async function googleTextToSpeech(text2, voice) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY environment variable is not set");
  }
  const requestBody = {
    input: { text: text2 },
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
      ssmlGender: voice.ssmlGender
    },
    audioConfig: {
      audioEncoding: "LINEAR16",
      sampleRateHertz: SAMPLE_RATE
    }
  };
  const response = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS API error (${response.status}): ${errorText}`);
  }
  const data = await response.json();
  const pcmData = Buffer2.from(data.audioContent, "base64");
  return wrapPcmInWav(pcmData);
}

// server/auth.ts
init_storage();
import * as admin from "firebase-admin";
var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    let user = await getUserByFirebaseUid(decoded.uid);
    if (!user) {
      const email = decoded.email;
      if (email) {
        user = await getUserByEmail(email);
        if (!user) {
          user = await createFirebaseUser(email, decoded.uid, decoded.name);
        }
      }
    }
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = { id: user.id, email: user.email, firstName: user.firstName };
    return next();
  } catch (err) {
    console.error("Auth verification error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
async function setupAuth(app2) {
  app2.post("/api/auth/verify", async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ error: "ID token is required" });
      }
      const decoded = await admin.auth().verifyIdToken(idToken);
      let user = await getUserByFirebaseUid(decoded.uid);
      if (!user) {
        const email = decoded.email;
        if (!email) {
          return res.status(400).json({ error: "Email not available from Firebase" });
        }
        user = await getUserByEmail(email);
        if (user) {
          const { db: db2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
          const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
          const { eq: eq3 } = await import("drizzle-orm");
          await db2.update(users2).set({ firebaseUid: decoded.uid }).where(eq3(users2.id, user.id));
          user = { ...user, firebaseUid: decoded.uid };
        } else {
          user = await createFirebaseUser(email, decoded.uid, decoded.name);
        }
      }
      return res.json({
        user: { id: user.id, email: user.email, firstName: user.firstName }
      });
    } catch (err) {
      console.error("Verify error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }
  });
  app2.get("/api/auth/me", requireAuth, (req, res) => {
    return res.json({ user: req.user });
  });
  app2.post("/api/auth/logout", (_req, res) => {
    return res.json({ success: true });
  });
}

// server/routes.ts
init_storage();
init_schema();
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { eq as eq2, and } from "drizzle-orm";
import { desc } from "drizzle-orm";
var anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL
});
var AUDIO_DIR = path.resolve(process.cwd(), "podcast-audio");
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
function getSystemPrompt(language, perspective, wordCount) {
  const perspectiveMap = {
    historical: {
      en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context.",
      nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op."
    },
    "iconic-figures": {
      en: "Focus on the key personalities and iconic figures central to this story. Bring them to life with vivid character details, their motivations, rivalries, and the human drama behind the events.",
      nl: "Focus op de belangrijkste persoonlijkheden en iconische figuren in dit verhaal. Breng ze tot leven met levendige karakterdetails, hun motivaties, rivaliteiten en het menselijke drama achter de gebeurtenissen."
    },
    origin: {
      en: "Tell the founding story of this museum. How did it come to be? What vision drove its creation? Cover the key moments from its origins to what it is today.",
      nl: "Vertel het ontstaansverhaal van dit museum. Hoe is het tot stand gekomen? Welke visie dreef de oprichting? Behandel de belangrijkste momenten van het ontstaan tot wat het nu is."
    },
    "prominent-art": {
      en: "Focus on the most famous and significant artworks in the collection. Tell the stories behind the masterpieces \u2014 who created them, why, and what makes them extraordinary.",
      nl: "Focus op de beroemdste en belangrijkste kunstwerken in de collectie. Vertel de verhalen achter de meesterwerken \u2014 wie ze maakte, waarom, en wat ze buitengewoon maakt."
    },
    architecture: {
      en: "Focus on the architecture and the building itself. Describe its design, the architect's vision, the construction story, and the architectural details that make it remarkable.",
      nl: "Focus op de architectuur en het gebouw zelf. Beschrijf het ontwerp, de visie van de architect, het bouwverhaal en de architectonische details die het bijzonder maken."
    },
    cultural: {
      en: "Focus on art, food, lifestyle, and cultural significance. Explore how culture shaped and was shaped by this topic.",
      nl: "Focus op kunst, eten, levensstijl en culturele betekenis. Verken hoe cultuur dit onderwerp vormde en erdoor werd gevormd."
    },
    "modern-times": {
      en: "Tell the story of how this place looks and feels today. What has changed in recent decades? How does modern life play out here? Capture the contemporary atmosphere.",
      nl: "Vertel het verhaal van hoe deze plek er vandaag uitziet en aanvoelt. Wat is er de afgelopen decennia veranderd? Hoe speelt het moderne leven zich hier af? Vang de hedendaagse sfeer."
    },
    "walking-tour": {
      en: "Guide the listener as if walking through Paris together. Describe what they would see, hear, and smell. Take them to the best and most famous places in the area. Use directional language and vivid sensory details.",
      nl: "Begeleid de luisteraar alsof je samen door Parijs wandelt. Beschrijf wat ze zouden zien, horen en ruiken. Neem ze mee naar de beste en beroemdste plekken in het gebied. Gebruik richtinggevende taal en levendige zintuiglijke details."
    }
  };
  const defaultStyle = {
    en: "Tell an engaging, well-rounded story covering the most interesting aspects of this topic.",
    nl: "Vertel een boeiend, veelzijdig verhaal dat de meest interessante aspecten van dit onderwerp behandelt."
  };
  const perspectiveText = perspective ? perspectiveMap[perspective]?.[language === "nl" ? "nl" : "en"] || defaultStyle[language === "nl" ? "nl" : "en"] : defaultStyle[language === "nl" ? "nl" : "en"];
  if (language === "nl") {
    return `Je bent een getalenteerde podcastverteller die boeiende, informatieve en meeslepende verhalen vertelt over Parijs. Je schrijft een podcast manuscript in vloeiend, natuurlijk Nederlands.

Stijl: ${perspectiveText}

Lengte: schrijf ongeveer ${wordCount} woorden.

Regels:
- Schrijf alsof je direct tegen de luisteraar praat in een warme, persoonlijke toon
- Begin meteen met het verhaal, geen titel of intro zoals "Welkom bij..."
- Maak het levendig en beeldend
- Gebruik geen opsommingstekens of koppen
- Schrijf in vloeiende alinea's
- Sluit af met een mooie, gedenkwaardige afsluitende gedachte`;
  }
  return `You are a talented podcast storyteller who tells engaging, informative, and immersive stories about Paris. You write a podcast script in fluent, natural English.

Style: ${perspectiveText}

Length: write approximately ${wordCount} words.

Rules:
- Write as if speaking directly to the listener in a warm, personal tone
- Start immediately with the story, no title or intro like "Welcome to..."
- Make it vivid and descriptive
- Do not use bullet points or headings
- Write in flowing paragraphs
- Close with a beautiful, memorable closing thought`;
}
function findDataChunk(wav) {
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
async function concatenateWavBuffers(buffers) {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];
  const pcmChunks = [];
  let sampleRate = 24e3;
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
  const totalPcmSize = pcmChunks.reduce((sum, chunk) => sum + chunk.length, 0);
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
  return Buffer.concat([header, ...pcmChunks]);
}
async function registerRoutes(app2) {
  app2.use("/api/podcast/audio", express.static(AUDIO_DIR));
  app2.post("/api/podcast/generate", requireAuth, async (req, res) => {
    try {
      const { topicId, topicName, topicNameNl, themeName, themeNameNl, perspective, voice, language, wordCount, lengthId } = req.body;
      const userId = req.user?.id;
      if (!topicName || !voice || !language) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const cacheAngle = perspective || "";
      const cacheLength = lengthId || "medium";
      if (topicId) {
        const [cached] = await db.select().from(cachedPodcasts).where(
          and(
            eq2(cachedPodcasts.topicId, topicId),
            eq2(cachedPodcasts.angle, cacheAngle),
            eq2(cachedPodcasts.voice, voice),
            eq2(cachedPodcasts.language, language),
            eq2(cachedPodcasts.length, cacheLength)
          )
        );
        if (cached) {
          const audioPath = path.join(AUDIO_DIR, cached.audioFilename);
          if (fs.existsSync(audioPath)) {
            console.log(`Cache hit for "${topicName}" [${cacheAngle || "no angle"}/${voice}/${language}/${cacheLength}]`);
            if (userId) {
              try {
                await db.insert(userPodcasts).values({
                  userId,
                  cachedPodcastId: cached.id,
                  topicName: topicName || "",
                  topicNameNl: topicNameNl || topicName || "",
                  themeName: themeName || "",
                  themeNameNl: themeNameNl || themeName || ""
                }).onConflictDoNothing();
              } catch (e) {
                console.error("Failed to save user-podcast link:", e);
              }
            }
            return res.json({
              id: cached.id,
              script: cached.script,
              audioUrl: `/api/podcast/audio/${cached.audioFilename}`,
              durationSeconds: cached.durationSeconds,
              cached: true
            });
          }
        }
      }
      const id = generateId();
      const systemPrompt = getSystemPrompt(language, perspective, wordCount || 750);
      const userPrompt = language === "nl" ? `Schrijf een podcast over: ${topicName} (thema: ${themeName} in Parijs)` : `Write a podcast about: ${topicName} (theme: ${themeName} in Paris)`;
      console.log(`Generating script for "${topicName}" [${cacheAngle || "no angle"}/${voice}/${language}/${cacheLength}]...`);
      const scriptResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt
      });
      const script = scriptResponse.content[0].type === "text" ? scriptResponse.content[0].text : "";
      console.log(`Script generated (${script.length} chars). Generating audio...`);
      const googleVoice = getGoogleVoice(voice, language);
      const paragraphs = script.split(/\n\n+/).filter((p) => p.trim());
      const chunks = [];
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
      const audioBuffers = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`  TTS chunk ${i + 1}/${chunks.length}...`);
        try {
          const audio = await googleTextToSpeech(chunks[i], googleVoice);
          if (audio.length > 44) {
            audioBuffers.push(audio);
          }
        } catch (err) {
          console.error(`  TTS chunk ${i + 1} failed:`, err);
        }
      }
      if (audioBuffers.length === 0) {
        return res.status(500).json({ error: "Audio generation failed" });
      }
      const combinedAudio = await concatenateWavBuffers(audioBuffers);
      const filename = `${id}.wav`;
      const filepath = path.join(AUDIO_DIR, filename);
      fs.writeFileSync(filepath, combinedAudio);
      let durationSeconds = 0;
      if (combinedAudio.length >= 44) {
        const wavChannels = combinedAudio.readUInt16LE(22);
        const wavSampleRate = combinedAudio.readUInt32LE(24);
        const wavBitsPerSample = combinedAudio.readUInt16LE(34);
        const wavByteRate = wavSampleRate * wavChannels * (wavBitsPerSample / 8);
        const dataInfo = findDataChunk(combinedAudio);
        const pcmSize = dataInfo ? dataInfo.size : combinedAudio.length - 44;
        durationSeconds = Math.round(pcmSize / wavByteRate);
      }
      console.log(`Podcast "${topicName}" ready (${(combinedAudio.length / 1024 / 1024).toFixed(1)} MB, ${durationSeconds}s)`);
      let cachedId = id;
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
            durationSeconds
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
            themeNameNl: themeNameNl || themeName || ""
          }).onConflictDoNothing();
        } catch (e) {
          console.error("Failed to save user-podcast link:", e);
        }
      }
      res.json({
        id: cachedId,
        script,
        audioUrl: `/api/podcast/audio/${filename}`,
        durationSeconds,
        cached: false
      });
    } catch (error) {
      console.error("Error generating podcast:", error);
      res.status(500).json({ error: "Failed to generate podcast" });
    }
  });
  app2.post("/api/podcast/generate-custom", requireAuth, async (req, res) => {
    try {
      const { subject, angle, voice, language, wordCount, lengthId } = req.body;
      const userId = req.user?.id;
      if (!subject || !angle || !voice || !language || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const customAngleMap = {
        historical: {
          en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context.",
          nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op."
        },
        "modern-culture": {
          en: "Focus on contemporary culture, modern-day significance, current trends, and how this topic connects to life in Paris today.",
          nl: "Focus op hedendaagse cultuur, de moderne betekenis, huidige trends en hoe dit onderwerp aansluit bij het leven in Parijs vandaag."
        },
        "personal-stories": {
          en: "Tell personal, intimate stories. Use anecdotes, first-person perspectives, and emotional storytelling to bring this topic to life through the eyes of real people.",
          nl: "Vertel persoonlijke, intieme verhalen. Gebruik anekdotes, eerstepersoonperspectieven en emotioneel vertellen om dit onderwerp tot leven te brengen door de ogen van echte mensen."
        }
      };
      const angleText = customAngleMap[angle]?.[language === "nl" ? "nl" : "en"] || customAngleMap["historical"][language === "nl" ? "nl" : "en"];
      const systemPrompt = language === "nl" ? `Je bent een getalenteerde podcastverteller die boeiende, informatieve en meeslepende verhalen vertelt over Parijs. Je schrijft een podcast manuscript in vloeiend, natuurlijk Nederlands.

Stijl: ${angleText}

Lengte: schrijf ongeveer ${wordCount || 400} woorden.

Regels:
- Schrijf alsof je direct tegen de luisteraar praat in een warme, persoonlijke toon
- Begin meteen met het verhaal, geen titel of intro zoals "Welkom bij..."
- Maak het levendig en beeldend
- Gebruik geen opsommingstekens of koppen
- Schrijf in vloeiende alinea's
- Sluit af met een mooie, gedenkwaardige afsluitende gedachte` : `You are a talented podcast storyteller who tells engaging, informative, and immersive stories about Paris. You write a podcast script in fluent, natural English.

Style: ${angleText}

Length: write approximately ${wordCount || 400} words.

Rules:
- Write as if speaking directly to the listener in a warm, personal tone
- Start immediately with the story, no title or intro like "Welcome to..."
- Make it vivid and descriptive
- Do not use bullet points or headings
- Write in flowing paragraphs
- Close with a beautiful, memorable closing thought`;
      const userPrompt = language === "nl" ? `Schrijf een podcast over: ${subject} (in de context van Parijs)` : `Write a podcast about: ${subject} (in the context of Paris)`;
      const id = generateId();
      console.log(`Generating custom podcast for user ${userId}: "${subject}" [${angle}/${voice}/${language}]...`);
      const scriptResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt
      });
      const script = scriptResponse.content[0].type === "text" ? scriptResponse.content[0].text : "";
      console.log(`Custom script generated (${script.length} chars). Generating audio...`);
      const googleVoice = getGoogleVoice(voice, language);
      const paragraphs = script.split(/\n\n+/).filter((p) => p.trim());
      const chunks = [];
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
      const audioBuffers = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`  TTS chunk ${i + 1}/${chunks.length}...`);
        try {
          const audio = await googleTextToSpeech(chunks[i], googleVoice);
          if (audio.length > 44) {
            audioBuffers.push(audio);
          }
        } catch (err) {
          console.error(`  TTS chunk ${i + 1} failed:`, err);
        }
      }
      if (audioBuffers.length === 0) {
        return res.status(500).json({ error: "Audio generation failed" });
      }
      const combinedAudio = await concatenateWavBuffers(audioBuffers);
      const filename = `custom_${id}.wav`;
      const filepath = path.join(AUDIO_DIR, filename);
      fs.writeFileSync(filepath, combinedAudio);
      let durationSeconds = 0;
      if (combinedAudio.length >= 44) {
        const wavChannels = combinedAudio.readUInt16LE(22);
        const wavSampleRate = combinedAudio.readUInt32LE(24);
        const wavBitsPerSample = combinedAudio.readUInt16LE(34);
        const wavByteRate = wavSampleRate * wavChannels * (wavBitsPerSample / 8);
        const dataInfo = findDataChunk(combinedAudio);
        const pcmSize = dataInfo ? dataInfo.size : combinedAudio.length - 44;
        durationSeconds = Math.round(pcmSize / wavByteRate);
      }
      const [saved] = await db.insert(customPodcasts).values({
        id,
        userId,
        subject,
        angle,
        voice,
        language,
        length: lengthId || "short",
        script,
        audioFilename: filename,
        durationSeconds
      }).returning();
      console.log(`Custom podcast "${subject}" ready for user ${userId} (${(combinedAudio.length / 1024 / 1024).toFixed(1)} MB, ${durationSeconds}s)`);
      res.json({
        id: saved.id,
        subject: saved.subject,
        script: saved.script,
        audioUrl: `/api/podcast/audio/${saved.audioFilename}`,
        durationSeconds: saved.durationSeconds,
        angle: saved.angle,
        voice: saved.voice,
        language: saved.language,
        length: saved.length,
        createdAt: saved.createdAt
      });
    } catch (error) {
      console.error("Error generating custom podcast:", error);
      res.status(500).json({ error: "Failed to generate custom podcast" });
    }
  });
  app2.get("/api/podcast/custom", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const results = await db.select().from(customPodcasts).where(eq2(customPodcasts.userId, userId)).orderBy(desc(customPodcasts.createdAt));
      const podcasts = results.map((p) => ({
        id: p.id,
        subject: p.subject,
        script: p.script,
        audioUrl: `/api/podcast/audio/${p.audioFilename}`,
        durationSeconds: p.durationSeconds,
        angle: p.angle,
        voice: p.voice,
        language: p.language,
        length: p.length,
        createdAt: p.createdAt
      }));
      res.json({ podcasts });
    } catch (error) {
      console.error("Error fetching custom podcasts:", error);
      res.status(500).json({ error: "Failed to fetch custom podcasts" });
    }
  });
  app2.get("/api/podcast/history", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const genericResults = await db.select({
        userPodcast: userPodcasts,
        cached: cachedPodcasts
      }).from(userPodcasts).innerJoin(cachedPodcasts, eq2(userPodcasts.cachedPodcastId, cachedPodcasts.id)).where(eq2(userPodcasts.userId, userId)).orderBy(desc(userPodcasts.createdAt));
      const genericPodcasts = genericResults.filter((r) => {
        const audioPath = path.join(AUDIO_DIR, r.cached.audioFilename);
        return fs.existsSync(audioPath);
      }).map((r) => ({
        id: r.cached.id,
        title: r.userPodcast.topicName,
        titleNl: r.userPodcast.topicNameNl,
        theme: r.userPodcast.themeName,
        themeNl: r.userPodcast.themeNameNl,
        script: r.cached.script,
        audioUrl: `/api/podcast/audio/${r.cached.audioFilename}`,
        durationSeconds: r.cached.durationSeconds,
        voice: r.cached.voice,
        language: r.cached.language,
        perspective: r.cached.angle,
        length: r.cached.length,
        createdAt: r.userPodcast.createdAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
        isCustom: false
      }));
      const customResults = await db.select().from(customPodcasts).where(eq2(customPodcasts.userId, userId)).orderBy(desc(customPodcasts.createdAt));
      const customPodcastsList = customResults.filter((p) => {
        const audioPath = path.join(AUDIO_DIR, p.audioFilename);
        return fs.existsSync(audioPath);
      }).map((p) => ({
        id: p.id,
        title: p.subject,
        titleNl: p.subject,
        theme: "Custom",
        themeNl: "Eigen",
        script: p.script,
        audioUrl: `/api/podcast/audio/${p.audioFilename}`,
        durationSeconds: p.durationSeconds,
        voice: p.voice,
        language: p.language,
        perspective: p.angle,
        length: p.length,
        createdAt: p.createdAt?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
        isCustom: true,
        customDbId: p.id
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
  app2.delete("/api/podcast/custom/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      const podcastId = req.params.id;
      const [podcast] = await db.select().from(customPodcasts).where(and(eq2(customPodcasts.id, podcastId), eq2(customPodcasts.userId, userId)));
      if (!podcast) {
        return res.status(404).json({ error: "Podcast not found" });
      }
      const audioPath = path.join(AUDIO_DIR, podcast.audioFilename);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      await db.delete(customPodcasts).where(eq2(customPodcasts.id, podcastId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom podcast:", error);
      res.status(500).json({ error: "Failed to delete custom podcast" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs2 from "fs";
import * as path2 from "path";
import * as net from "net";
import { spawn, execSync } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
var app = express2();
app.set("trust proxy", 1);
var log = console.log;
var METRO_PORT = 8081;
var isDev = process.env.NODE_ENV !== "production";
var metroProcess = null;
function isPortInUse(port) {
  return new Promise((resolve3) => {
    const socket = new net.Socket();
    socket.setTimeout(1e3);
    socket.on("connect", () => {
      socket.destroy();
      resolve3(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve3(false);
    });
    socket.on("error", () => {
      resolve3(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}
function killProcessOnPort(port) {
  try {
    const pids = execSync(`lsof -ti:${port} 2>/dev/null`).toString().trim();
    if (pids) {
      pids.split("\n").forEach((pid) => {
        try {
          process.kill(parseInt(pid), "SIGKILL");
        } catch {
        }
      });
      log(`[Metro] Killed stale process(es) on port ${port}`);
    }
  } catch {
  }
}
async function startMetroBundler() {
  if (!isDev) return;
  const portBusy = await isPortInUse(METRO_PORT);
  if (portBusy) {
    log(`[Metro] Port ${METRO_PORT} is busy, killing stale processes...`);
    killProcessOnPort(METRO_PORT);
    await new Promise((r) => setTimeout(r, 2e3));
  }
  log("[Metro] Starting bundler on port", METRO_PORT);
  const metro = spawn("npx", ["expo", "start", "--port", String(METRO_PORT), "--localhost"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "1",
      EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_DEV_DOMAIN}`,
      REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN || "0.0.0.0",
      EXPO_PUBLIC_DOMAIN: `${process.env.REPLIT_DEV_DOMAIN}`,
      EXPO_USE_FAST_RESOLVER: "1",
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "",
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
      EXPO_PUBLIC_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || ""
    },
    cwd: process.cwd()
  });
  metroProcess = metro;
  metro.stdout?.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg) log("[Metro]", msg);
  });
  metro.stderr?.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes("DeprecationWarning")) log("[Metro:err]", msg);
  });
  metro.on("close", (code) => {
    log("[Metro] exited with code", code);
    metroProcess = null;
  });
  await new Promise((resolve3) => {
    const check = async () => {
      const ready = await isPortInUse(METRO_PORT);
      if (ready) {
        log("[Metro] Bundler is ready");
        resolve3();
      } else {
        setTimeout(check, 1e3);
      }
    };
    setTimeout(check, 3e3);
    setTimeout(() => {
      log("[Metro] Timed out waiting for Metro, continuing anyway");
      resolve3();
    }, 3e4);
  });
}
function cleanupMetro() {
  if (metroProcess) {
    log("[Metro] Shutting down...");
    metroProcess.kill("SIGTERM");
    metroProcess = null;
  }
}
process.on("SIGINT", () => {
  cleanupMetro();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanupMetro();
  process.exit(0);
});
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origin = req.header("origin");
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, expo-platform, expo-runtime-version, expo-dev-client-id");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use((req, _res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform || req.path === "/status" || req.path.endsWith(".bundle") || req.path.endsWith(".map")) {
      return next();
    }
    next();
  });
  app2.use("/api", express2.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app2.use("/api", express2.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!reqPath.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path2.resolve(process.cwd(), "app.json");
    const appJsonContent = fs2.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.status(200).send(html);
}
function setupMetroProxy(app2) {
  if (!isDev) return;
  const metroProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${METRO_PORT}`,
    changeOrigin: true,
    ws: true,
    on: {
      error: (err, _req, res) => {
        log("[Proxy] Error:", err.message);
        if (res && "writeHead" in res && !("writableEnded" in res && res.writableEnded)) {
          try {
            res.writeHead(502);
            res.end("Metro bundler not ready");
          } catch {
          }
        }
      }
    }
  });
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path === "/" && !req.header("expo-platform")) {
      return next();
    }
    metroProxy(req, res, next);
  });
  log("[Proxy] Metro proxy configured -> port", METRO_PORT);
}
function configureStaticAndLanding(app2) {
  const templatePath = path2.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs2.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  app2.use((req, res, next) => {
    if (req.path === "/" && !req.header("expo-platform")) {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express2.static(path2.resolve(process.cwd(), "assets")));
  if (!isDev) {
    app2.use(express2.static(path2.resolve(process.cwd(), "static-build")));
  }
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });
}
(async () => {
  setupCors(app);
  setupRequestLogging(app);
  await setupAuth(app);
  setupMetroProxy(app);
  setupBodyParsing(app);
  configureStaticAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    async () => {
      log(`Express server on port ${port}`);
      if (isDev) {
        await startMetroBundler();
        log(`Metro bundler proxied through Express on port ${port}`);
      }
    }
  );
})();
