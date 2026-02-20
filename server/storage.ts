import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, customPodcasts, userPodcasts, type User } from "@shared/schema";

export const db = drizzle(process.env.DATABASE_URL!);

export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserByFirebaseUid(uid: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.firebaseUid, uid));
  return user;
}

export async function createFirebaseUser(
  email: string,
  firebaseUid: string,
  firstName?: string,
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ email, firebaseUid, firstName: firstName || null })
    .returning();
  return user;
}

export async function getUserCustomPodcastAudioFiles(userId: string): Promise<string[]> {
  const podcasts = await db.select({ audioFilename: customPodcasts.audioFilename })
    .from(customPodcasts)
    .where(eq(customPodcasts.userId, userId));
  return podcasts.map(p => p.audioFilename);
}

export async function deleteUserAndData(userId: string): Promise<void> {
  await db.delete(customPodcasts).where(eq(customPodcasts.userId, userId));
  await db.delete(userPodcasts).where(eq(userPodcasts.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
