import type { Response } from "express";
import * as fs from "fs";
import * as path from "path";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";

export const AUDIO_DIR = path.resolve(process.cwd(), "podcast-audio");
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

export function getAudioBucketName(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  }
  return bucketId;
}

export function audioStoragePath(cityId: string, filename: string): string {
  return `podcast-audio/${cityId}/${filename}`;
}

export function legacyAudioStoragePath(filename: string): string {
  return `podcast-audio/${filename}`;
}

export async function uploadAudioToStorage(cityId: string, filename: string, audioBuffer: Buffer): Promise<void> {
  const bucketName = getAudioBucketName();
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(audioStoragePath(cityId, filename));
  await file.save(audioBuffer, {
    contentType: "audio/wav",
    resumable: false,
  });
  console.log(`Uploaded ${filename} to Object Storage (city: ${cityId})`);
}

export async function audioExistsInStorage(cityId: string, filename: string): Promise<boolean> {
  try {
    const bucketName = getAudioBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(audioStoragePath(cityId, filename));
    const [exists] = await file.exists();
    if (exists) return true;
    const legacyFile = bucket.file(legacyAudioStoragePath(filename));
    const [legacyExists] = await legacyFile.exists();
    return legacyExists;
  } catch {
    return false;
  }
}

export async function deleteAudioFromStorage(cityId: string, filename: string): Promise<void> {
  try {
    const bucketName = getAudioBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    for (const p of [audioStoragePath(cityId, filename), legacyAudioStoragePath(filename)]) {
      const file = bucket.file(p);
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
        console.log(`Deleted ${filename} from Object Storage (${p})`);
      }
    }
  } catch (err) {
    console.error(`Failed to delete ${filename} from Object Storage:`, err);
  }
}

export async function renameAudioInStorage(cityId: string, oldFilename: string, newFilename: string): Promise<string> {
  try {
    const bucketName = getAudioBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    let sourceFile = bucket.file(audioStoragePath(cityId, oldFilename));
    let [exists] = await sourceFile.exists();
    if (!exists) {
      sourceFile = bucket.file(legacyAudioStoragePath(oldFilename));
      [exists] = await sourceFile.exists();
    }
    if (exists) {
      const [content] = await sourceFile.download();
      const newFile = bucket.file(audioStoragePath(cityId, newFilename));
      await newFile.save(content, { contentType: "audio/wav", resumable: false });
      await sourceFile.delete();
    }

    const oldPath = path.join(AUDIO_DIR, oldFilename);
    const newPath = path.join(AUDIO_DIR, newFilename);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }

    return newFilename;
  } catch (err) {
    console.error("Failed to rename audio, using original filename:", err);
    return oldFilename;
  }
}

export async function streamAudioFromStorage(cityId: string, filename: string, res: Response): Promise<boolean> {
  try {
    const bucketName = getAudioBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    let file = bucket.file(audioStoragePath(cityId, filename));
    let [exists] = await file.exists();
    if (!exists) {
      file = bucket.file(legacyAudioStoragePath(filename));
      [exists] = await file.exists();
      if (!exists) return false;
    }

    const [metadata] = await file.getMetadata();
    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": String(metadata.size || 0),
      "Cache-Control": "public, max-age=86400",
      "Accept-Ranges": "bytes",
    });

    const stream = file.createReadStream();
    stream.on("error", (err) => {
      console.error("Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming audio" });
      }
    });
    stream.pipe(res);
    return true;
  } catch {
    return false;
  }
}
