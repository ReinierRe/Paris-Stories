import { Buffer } from "node:buffer";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

const SAMPLE_RATE = 24000;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

export type VoiceType = "chirp3" | "neural2" | "wavenet";

export type GoogleVoice = {
  languageCode: string;
  name: string;
  ssmlGender: "MALE" | "FEMALE" | "NEUTRAL";
  voiceType: VoiceType;
};

const LANGUAGE_VOICES: Record<string, Record<string, GoogleVoice>> = {
  nl: {
    male: { languageCode: "nl-NL", name: "nl-NL-Chirp3-HD-Algieba", ssmlGender: "MALE", voiceType: "chirp3" },
    female: { languageCode: "nl-NL", name: "nl-NL-Chirp3-HD-Callirrhoe", ssmlGender: "FEMALE", voiceType: "chirp3" },
  },
  en: {
    male: { languageCode: "en-US", name: "en-US-Chirp3-HD-Algieba", ssmlGender: "MALE", voiceType: "chirp3" },
    female: { languageCode: "en-US", name: "en-US-Chirp3-HD-Callirrhoe", ssmlGender: "FEMALE", voiceType: "chirp3" },
  },
  fr: {
    male: { languageCode: "fr-FR", name: "fr-FR-Neural2-B", ssmlGender: "MALE", voiceType: "neural2" },
    female: { languageCode: "fr-FR", name: "fr-FR-Neural2-A", ssmlGender: "FEMALE", voiceType: "neural2" },
  },
  es: {
    male: { languageCode: "es-ES", name: "es-ES-Neural2-B", ssmlGender: "MALE", voiceType: "neural2" },
    female: { languageCode: "es-ES", name: "es-ES-Neural2-A", ssmlGender: "FEMALE", voiceType: "neural2" },
  },
  de: {
    male: { languageCode: "de-DE", name: "de-DE-Neural2-B", ssmlGender: "MALE", voiceType: "neural2" },
    female: { languageCode: "de-DE", name: "de-DE-Neural2-A", ssmlGender: "FEMALE", voiceType: "neural2" },
  },
  it: {
    male: { languageCode: "it-IT", name: "it-IT-Neural2-C", ssmlGender: "MALE", voiceType: "neural2" },
    female: { languageCode: "it-IT", name: "it-IT-Neural2-A", ssmlGender: "FEMALE", voiceType: "neural2" },
  },
  pt: {
    male: { languageCode: "pt-BR", name: "pt-BR-Neural2-B", ssmlGender: "MALE", voiceType: "neural2" },
    female: { languageCode: "pt-BR", name: "pt-BR-Neural2-A", ssmlGender: "FEMALE", voiceType: "neural2" },
  },
  ja: {
    male: { languageCode: "ja-JP", name: "ja-JP-Neural2-C", ssmlGender: "MALE", voiceType: "neural2" },
    female: { languageCode: "ja-JP", name: "ja-JP-Neural2-B", ssmlGender: "FEMALE", voiceType: "neural2" },
  },
  zh: {
    male: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-B", ssmlGender: "MALE", voiceType: "wavenet" },
    female: { languageCode: "cmn-CN", name: "cmn-CN-Wavenet-A", ssmlGender: "FEMALE", voiceType: "wavenet" },
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

export function isChirp3Voice(voice: GoogleVoice): boolean {
  return voice.voiceType === "chirp3";
}

export function getGoogleVoiceType(voicePref: string, language: string = "nl"): VoiceType {
  return getGoogleVoice(voicePref, language).voiceType;
}

export async function googleTextToSpeech(
  text: string,
  voice: GoogleVoice
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY environment variable is not set");
  }

  let input: Record<string, string>;
  if (voice.voiceType === "chirp3") {
    const cleanText = text
      .replace(/\[pause short\]|\[pause long\]|\[pause\]/gi, "")
      .replace(/\[(fluisterend|enthousiast|verbaasd|peinzend|whispering|excited|surprised|thoughtful)\]/gi, "")
      .replace(/ {2,}/g, " ")
      .trim();
    input = { text: cleanText };
  } else {
    const isSsml = text.trim().startsWith("<speak>");
    input = isSsml ? { ssml: text } : { text };
  }

  const audioConfig: Record<string, unknown> = {
    audioEncoding: "LINEAR16" as const,
    sampleRateHertz: SAMPLE_RATE,
  };

  const requestBody = {
    input,
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
      ssmlGender: voice.ssmlGender,
    },
    audioConfig,
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
