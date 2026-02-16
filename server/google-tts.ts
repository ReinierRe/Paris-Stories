import { Buffer } from "node:buffer";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

export type GoogleVoice = {
  languageCode: string;
  name: string;
  ssmlGender: "MALE" | "FEMALE" | "NEUTRAL";
};

const LANGUAGE_VOICES: Record<string, Record<string, GoogleVoice>> = {
  nl: {
    male: { languageCode: "nl-NL", name: "nl-NL-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "nl-NL", name: "nl-NL-Wavenet-A", ssmlGender: "FEMALE" },
  },
  en: {
    male: { languageCode: "en-US", name: "en-US-Wavenet-D", ssmlGender: "MALE" },
    female: { languageCode: "en-US", name: "en-US-Wavenet-F", ssmlGender: "FEMALE" },
  },
  fr: {
    male: { languageCode: "fr-FR", name: "fr-FR-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "fr-FR", name: "fr-FR-Wavenet-A", ssmlGender: "FEMALE" },
  },
  es: {
    male: { languageCode: "es-ES", name: "es-ES-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "es-ES", name: "es-ES-Wavenet-A", ssmlGender: "FEMALE" },
  },
  de: {
    male: { languageCode: "de-DE", name: "de-DE-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "de-DE", name: "de-DE-Wavenet-A", ssmlGender: "FEMALE" },
  },
  it: {
    male: { languageCode: "it-IT", name: "it-IT-Wavenet-C", ssmlGender: "MALE" },
    female: { languageCode: "it-IT", name: "it-IT-Wavenet-A", ssmlGender: "FEMALE" },
  },
  pt: {
    male: { languageCode: "pt-BR", name: "pt-BR-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "pt-BR", name: "pt-BR-Wavenet-A", ssmlGender: "FEMALE" },
  },
  ja: {
    male: { languageCode: "ja-JP", name: "ja-JP-Wavenet-C", ssmlGender: "MALE" },
    female: { languageCode: "ja-JP", name: "ja-JP-Wavenet-A", ssmlGender: "FEMALE" },
  },
  zh: {
    male: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-B", ssmlGender: "MALE" },
    female: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-A", ssmlGender: "FEMALE" },
  },
};

export function getGoogleVoice(voicePref: string, language: string = "nl"): GoogleVoice {
  const lang = language.toLowerCase();
  const langVoices = LANGUAGE_VOICES[lang];
  if (!langVoices) {
    console.warn(`Unknown language "${language}" for Google TTS, defaulting to Dutch (nl)`);
  }
  const voices = langVoices || LANGUAGE_VOICES["nl"];
  if (voicePref === "male") return voices.male;
  return voices.female;
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

export async function googleTextToSpeech(
  text: string,
  voice: GoogleVoice
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY environment variable is not set");
  }

  const isSsml = text.trim().startsWith("<speak>");
  const input = isSsml ? { ssml: text } : { text };

  const requestBody = {
    input,
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
      ssmlGender: voice.ssmlGender,
    },
    audioConfig: {
      audioEncoding: "LINEAR16" as const,
      sampleRateHertz: SAMPLE_RATE,
    },
  };

  const response = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS API error (${response.status}): ${errorText}`);
  }

  const data = await response.json() as { audioContent: string };
  const pcmData = Buffer.from(data.audioContent, "base64");
  return wrapPcmInWav(pcmData);
}
