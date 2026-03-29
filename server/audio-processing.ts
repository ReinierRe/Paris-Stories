export function findDataChunk(wav: Buffer): { offset: number; size: number } | null {
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

export async function concatenateWavBuffers(buffers: Buffer[]): Promise<Buffer> {
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
