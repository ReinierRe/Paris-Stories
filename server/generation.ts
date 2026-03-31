import Anthropic from "@anthropic-ai/sdk";
import { textToSpeech } from "./tts";
import type { VoiceType } from "./google-tts";
import * as fs from "fs";
import * as path from "path";
import { AUDIO_DIR, uploadAudioToStorage } from "./audio-storage";
import { findDataChunk, concatenateWavBuffers } from "./audio-processing";
import { generationJobs, generateId } from "./job-tracker";
import { stripSsmlTags } from "./prompts";

export const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL!,
});

export async function generateScriptAndAudio(params: {
  cityId: string;
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

  rawScript = rawScript.replace(/^#{1,6}\s+.+\n+/, "").trim();

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

  await uploadAudioToStorage(params.cityId, filename, combinedAudio);

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

export async function moderateContent(prompt: string): Promise<"ALLOW" | "REJECT"> {
  const moderationResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 20,
    messages: [{ role: "user", content: prompt }],
  });
  const firstBlock = moderationResponse.content[0];
  const result = firstBlock?.type === "text" ? firstBlock.text.trim().toUpperCase() : "";
  return result === "ALLOW" ? "ALLOW" : "REJECT";
}

export async function generatePodcastTitle(subject: string, language: string): Promise<string> {
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

  const firstBlock = titleResponse.content[0];
  const titleText = firstBlock?.type === "text"
    ? firstBlock.text.trim().replace(/^["'""]|["'""]$/g, "")
    : "";
  if (titleText.length > 0 && titleText.length <= 80) {
    return titleText;
  }
  return subject.length > 60 ? subject.substring(0, 57) + "..." : subject;
}
