import { Buffer } from "node:buffer";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

export type ElevenLabsVoiceConfig = {
  voiceId: string;
  name: string;
};

const LANGUAGE_VOICES: Record<string, Record<string, ElevenLabsVoiceConfig>> = {
  nl: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  en: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  fr: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  es: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  de: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  it: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  pt: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  ja: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
  zh: {
    male: { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam" },
    female: { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
  },
};

export function getElevenLabsVoice(voicePref: string, language: string = "nl"): ElevenLabsVoiceConfig {
  const lang = language.toLowerCase();
  const langVoices = LANGUAGE_VOICES[lang];
  if (!langVoices) {
    console.warn(`Unknown language "${language}" for ElevenLabs TTS, defaulting to Dutch (nl)`);
  }
  const voices = langVoices || LANGUAGE_VOICES["nl"];
  if (voicePref === "male") return voices.male;
  return voices.female;
}

async function getElevenLabsApiKey(): Promise<string> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error("ElevenLabs: Replit identity token not available");
  }

  if (!hostname) {
    throw new Error("ElevenLabs: REPLIT_CONNECTORS_HOSTNAME not set");
  }

  const res = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=elevenlabs",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`ElevenLabs: Failed to fetch credentials (${res.status})`);
  }

  const data = await res.json() as { items?: Array<{ settings: { api_key: string } }> };
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("ElevenLabs not connected - API key not found");
  }

  return connectionSettings.settings.api_key;
}

function wrapPcmInWav(pcmData: Buffer): Buffer {
  const byteRate = SAMPLE_RATE * NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = NUM_CHANNELS * (BITS_PER_SAMPLE / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);
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

  return Buffer.concat([header, pcmData]);
}

export async function elevenLabsTextToSpeech(
  text: string,
  voice: ElevenLabsVoiceConfig
): Promise<Buffer> {
  const apiKey = await getElevenLabsApiKey();

  const response = await fetch(`${ELEVENLABS_TTS_URL}/${voice.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      output_format: "pcm_24000",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS API error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const pcmData = Buffer.from(arrayBuffer);
  return wrapPcmInWav(pcmData);
}
