import { Buffer } from "node:buffer";
import { googleTextToSpeech, getGoogleVoice } from "./google-tts";

export async function textToSpeech(
  text: string,
  voicePref: string,
  language: string
): Promise<Buffer> {
  const googleVoice = getGoogleVoice(voicePref, language);
  return await googleTextToSpeech(text, googleVoice);
}
