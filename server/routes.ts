import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { textToSpeech, getActiveProvider } from "./tts";
import { requireAuth } from "./auth";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { eq, and } from "drizzle-orm";
import { db } from "./storage";
import { cachedPodcasts, customPodcasts, userPodcasts } from "@shared/schema";
import { desc } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL!,
});

const AUDIO_DIR = path.resolve(process.cwd(), "podcast-audio");
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface GenerationJob {
  status: "generating" | "ready" | "error";
  progress?: string;
  result?: {
    id: string;
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


function getSystemPrompt(language: string, perspective: string, wordCount: number): string {
  const perspectiveMap: Record<string, { en: string; nl: string }> = {
    historical: {
      en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context.",
      nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op.",
    },
    "iconic-figures": {
      en: "Focus on the key personalities and iconic figures central to this story. Bring them to life with vivid character details, their motivations, rivalries, and the human drama behind the events.",
      nl: "Focus op de belangrijkste persoonlijkheden en iconische figuren in dit verhaal. Breng ze tot leven met levendige karakterdetails, hun motivaties, rivaliteiten en het menselijke drama achter de gebeurtenissen.",
    },
    origin: {
      en: "Tell the founding story of this museum. How did it come to be? What vision drove its creation? Cover the key moments from its origins to what it is today.",
      nl: "Vertel het ontstaansverhaal van dit museum. Hoe is het tot stand gekomen? Welke visie dreef de oprichting? Behandel de belangrijkste momenten van het ontstaan tot wat het nu is.",
    },
    "prominent-art": {
      en: "Focus on the most famous and significant artworks in the collection. Tell the stories behind the masterpieces — who created them, why, and what makes them extraordinary.",
      nl: "Focus op de beroemdste en belangrijkste kunstwerken in de collectie. Vertel de verhalen achter de meesterwerken — wie ze maakte, waarom, en wat ze buitengewoon maakt.",
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

async function generateScriptAndAudio(params: {
  systemPrompt: string;
  userPrompt: string;
  voice: string;
  language: string;
  topicName: string;
  jobId: string;
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

  const script = scriptResponse.content[0].type === "text" ? scriptResponse.content[0].text : "";
  console.log(`Script generated (${script.length} chars). Generating audio...`);

  if (job) job.progress = "Generating audio...";

  const ttsProvider = getActiveProvider();
  console.log(`Using TTS provider: ${ttsProvider}`);

  const paragraphs = script.split(/\n\n+/).filter((p) => p.trim());
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

  const audioBuffers: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    if (job) job.progress = `Generating audio (${i + 1}/${chunks.length})...`;
    console.log(`  TTS chunk ${i + 1}/${chunks.length}...`);
    try {
      const audio = await textToSpeech(chunks[i], params.voice, params.language);
      if (audio.length > 44) {
        audioBuffers.push(audio);
      }
    } catch (err) {
      console.error(`  TTS chunk ${i + 1} failed:`, err);
    }
  }

  if (audioBuffers.length === 0) {
    throw new Error("Audio generation failed");
  }

  const combinedAudio = await concatenateWavBuffers(audioBuffers);
  const id = generateId();
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
    const pcmSize = dataInfo ? dataInfo.size : (combinedAudio.length - 44);
    durationSeconds = Math.round(pcmSize / wavByteRate);
  }

  console.log(`Podcast "${params.topicName}" ready (${(combinedAudio.length / 1024 / 1024).toFixed(1)} MB, ${durationSeconds}s)`);

  return { script, filename, durationSeconds, combinedAudio };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/podcast/audio", express.static(AUDIO_DIR));

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
                audioUrl: `/api/podcast/audio/${cached.audioFilename}`,
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

      const systemPrompt = getSystemPrompt(language, perspective, wordCount || 750);
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
            audioUrl: `/api/podcast/audio/${filename}`,
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
          en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context.",
          nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op.",
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

      const systemPrompt = language === "nl"
        ? `Je bent een getalenteerde podcastverteller die boeiende, informatieve en meeslepende verhalen vertelt over Parijs. Je schrijft een podcast manuscript in vloeiend, natuurlijk Nederlands.

Stijl: ${angleText}

Lengte: schrijf ongeveer ${wordCount || 400} woorden.

Regels:
- Schrijf alsof je direct tegen de luisteraar praat in een warme, persoonlijke toon
- Begin meteen met het verhaal, geen titel of intro zoals "Welkom bij..."
- Maak het levendig en beeldend
- Gebruik geen opsommingstekens of koppen
- Schrijf in vloeiende alinea's
- Sluit af met een mooie, gedenkwaardige afsluitende gedachte`
        : `You are a talented podcast storyteller who tells engaging, informative, and immersive stories about Paris. You write a podcast script in fluent, natural English.

Style: ${angleText}

Length: write approximately ${wordCount || 400} words.

Rules:
- Write as if speaking directly to the listener in a warm, personal tone
- Start immediately with the story, no title or intro like "Welcome to..."
- Make it vivid and descriptive
- Do not use bullet points or headings
- Write in flowing paragraphs
- Close with a beautiful, memorable closing thought`;

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
      }).then(async ({ script, filename, durationSeconds }) => {
        const customFilename = `custom_${filename}`;
        const oldPath = path.join(AUDIO_DIR, filename);
        const newPath = path.join(AUDIO_DIR, customFilename);
        fs.renameSync(oldPath, newPath);

        const id = generateId();
        const [saved] = await db.insert(customPodcasts).values({
          id,
          userId,
          subject,
          angle,
          voice,
          language,
          length: lengthId || "short",
          script,
          audioFilename: customFilename,
          durationSeconds,
        }).returning();

        console.log(`Custom podcast "${subject}" ready for user ${userId} (${durationSeconds}s)`);

        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "ready";
          job.result = {
            id: saved.id,
            subject: saved.subject,
            script: saved.script,
            audioUrl: `/api/podcast/audio/${saved.audioFilename}`,
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
        subject: p.subject,
        script: p.script,
        audioUrl: `/api/podcast/audio/${p.audioFilename}`,
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
        .filter((r) => {
          const audioPath = path.join(AUDIO_DIR, r.cached.audioFilename);
          return fs.existsSync(audioPath);
        })
        .map((r) => ({
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
          createdAt: r.userPodcast.createdAt?.toISOString() || new Date().toISOString(),
          isCustom: false,
        }));

      const customResults = await db
        .select()
        .from(customPodcasts)
        .where(eq(customPodcasts.userId, userId))
        .orderBy(desc(customPodcasts.createdAt));

      const customPodcastsList = customResults
        .filter((p) => {
          const audioPath = path.join(AUDIO_DIR, p.audioFilename);
          return fs.existsSync(audioPath);
        })
        .map((p) => ({
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
