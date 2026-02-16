import { Buffer } from "node:buffer";
import { googleTextToSpeech, getGoogleVoice } from "./google-tts";
import { elevenLabsTextToSpeech, getElevenLabsVoice } from "./elevenlabs-tts";

export type TtsProvider = "elevenlabs" | "google";

const DEFAULT_PROVIDER: TtsProvider = "elevenlabs";

export function getActiveProvider(): TtsProvider {
  const env = process.env.TTS_PROVIDER?.toLowerCase();
  if (env === "google" || env === "elevenlabs") return env;
  return DEFAULT_PROVIDER;
}

export async function textToSpeech(
  text: string,
  voicePref: string,
  language: string,
  provider?: TtsProvider
): Promise<Buffer> {
  const activeProvider = provider || getActiveProvider();

  if (activeProvider === "elevenlabs") {
    try {
      const voice = getElevenLabsVoice(voicePref, language);
      return await elevenLabsTextToSpeech(text, voice);
    } catch (err) {
      console.warn(`ElevenLabs TTS failed, falling back to Google TTS:`, err);
      const googleVoice = getGoogleVoice(voicePref, language);
      return await googleTextToSpeech(text, googleVoice);
    }
  }

  const googleVoice = getGoogleVoice(voicePref, language);
  return await googleTextToSpeech(text, googleVoice);
}
