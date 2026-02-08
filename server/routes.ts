import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import Anthropic from "@anthropic-ai/sdk";
import { textToSpeech } from "./replit_integrations/audio/client";
import { requireAuth } from "./auth";
import * as fs from "fs";
import * as path from "path";
import express from "express";

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

type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

function getVoice(voicePref: string): Voice {
  if (voicePref === "male") return "onyx";
  return "nova";
}

function getSystemPrompt(language: string, perspective: string, wordCount: number): string {
  const perspectiveMap: Record<string, { en: string; nl: string }> = {
    historical: {
      en: "Use a factual, chronological storytelling approach. Include specific dates, names, and historical context.",
      nl: "Gebruik een feitelijke, chronologische vertelbenadering. Neem specifieke data, namen en historische context op.",
    },
    personal: {
      en: "Tell the story through personal anecdotes, human experiences, and emotional connections. Make listeners feel like they are hearing from a friend.",
      nl: "Vertel het verhaal door persoonlijke anekdotes, menselijke ervaringen en emotionele verbindingen. Laat luisteraars het gevoel hebben dat ze van een vriend horen.",
    },
    cultural: {
      en: "Focus on art, food, lifestyle, and cultural significance. Explore how culture shaped and was shaped by this topic.",
      nl: "Focus op kunst, eten, levensstijl en culturele betekenis. Verken hoe cultuur dit onderwerp vormde en erdoor werd gevormd.",
    },
    "walking-tour": {
      en: "Guide the listener as if walking through Paris together. Describe what they would see, hear, and smell. Use directional language and vivid sensory details.",
      nl: "Begeleid de luisteraar alsof je samen door Parijs wandelt. Beschrijf wat ze zouden zien, horen en ruiken. Gebruik richtinggevende taal en levendige zintuiglijke details.",
    },
  };

  const perspectiveText = perspectiveMap[perspective]?.[language === "nl" ? "nl" : "en"] || perspectiveMap.historical.en;

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

export async function registerRoutes(app: Express): Promise<Server> {
  app.use("/api/podcast/audio", express.static(AUDIO_DIR));

  app.post("/api/podcast/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { topicName, themeName, perspective, voice, language, wordCount } = req.body;

      if (!topicName || !perspective || !voice || !language) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const id = generateId();
      const systemPrompt = getSystemPrompt(language, perspective, wordCount || 750);

      const userPrompt =
        language === "nl"
          ? `Schrijf een podcast over: ${topicName} (thema: ${themeName} in Parijs)`
          : `Write a podcast about: ${topicName} (theme: ${themeName} in Paris)`;

      console.log(`Generating script for "${topicName}"...`);
      const scriptResponse = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 8192,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt,
      });

      const script =
        scriptResponse.content[0].type === "text" ? scriptResponse.content[0].text : "";

      console.log(`Script generated (${script.length} chars). Generating audio...`);

      const openaiVoice = getVoice(voice);

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
        console.log(`  TTS chunk ${i + 1}/${chunks.length}...`);
        try {
          const audio = await textToSpeech(chunks[i], openaiVoice, "wav");
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
        const pcmSize = dataInfo ? dataInfo.size : (combinedAudio.length - 44);
        durationSeconds = Math.round(pcmSize / wavByteRate);
      }

      console.log(`Podcast "${topicName}" ready (${(combinedAudio.length / 1024 / 1024).toFixed(1)} MB, ${durationSeconds}s)`);

      res.json({
        id,
        script,
        audioUrl: `/api/podcast/audio/${filename}`,
        durationSeconds,
      });
    } catch (error) {
      console.error("Error generating podcast:", error);
      res.status(500).json({ error: "Failed to generate podcast" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
