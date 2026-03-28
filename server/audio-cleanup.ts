import * as fs from "fs";
import * as path from "path";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";

const AUDIO_DIR = path.resolve(process.cwd(), "podcast-audio");

function getAudioBucketName(): string {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || "";
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID not set");
  }
  return bucketId;
}

export async function deleteAudioFiles(filenames: string[], cityId: string = "paris"): Promise<void> {
  for (const filename of filenames) {
    try {
      const localPath = path.join(AUDIO_DIR, filename);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err) {
      console.warn(`Failed to delete local audio file ${filename}:`, err);
    }

    try {
      const bucketName = getAudioBucketName();
      const bucket = objectStorageClient.bucket(bucketName);
      for (const p of [`podcast-audio/${cityId}/${filename}`, `podcast-audio/${filename}`]) {
        const file = bucket.file(p);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
          console.log(`Deleted ${filename} from Object Storage (${p})`);
        }
      }
    } catch (err) {
      console.warn(`Failed to delete ${filename} from Object Storage:`, err);
    }
  }
}
