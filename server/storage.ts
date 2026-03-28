import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, customPodcasts, userPodcasts, type User } from "@shared/schema";

export const db = drizzle(process.env.DATABASE_URL!);

export async function getUser(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByEmail(email: string, cityId: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(
    and(eq(users.email, email), eq(users.cityId, cityId))
  );
  return user;
}

export async function getUserByFirebaseUid(uid: string, cityId: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(and(eq(users.firebaseUid, uid), eq(users.cityId, cityId)));
  return user;
}

export async function createFirebaseUser(
  email: string,
  firebaseUid: string,
  cityId: string,
  firstName?: string,
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ email, firebaseUid, cityId, firstName: firstName || null })
    .returning();
  return user;
}

export async function getUserCustomPodcastAudioFiles(userId: string): Promise<string[]> {
  const podcasts = await db.select({ audioFilename: customPodcasts.audioFilename })
    .from(customPodcasts)
    .where(eq(customPodcasts.userId, userId));
  return podcasts.map(p => p.audioFilename);
}

export async function updateUserPreferences(
  userId: string,
  preferences: { preferredLanguage?: string; preferredVoice?: string },
): Promise<User | undefined> {
  const updates: Record<string, string> = {};
  if (preferences.preferredLanguage) updates.preferredLanguage = preferences.preferredLanguage;
  if (preferences.preferredVoice) updates.preferredVoice = preferences.preferredVoice;
  if (Object.keys(updates).length === 0) return getUser(userId);
  const [user] = await db.update(users).set(updates).where(eq(users.id, userId)).returning();
  return user;
}

export async function deleteUserAndData(userId: string): Promise<void> {
  await db.delete(customPodcasts).where(eq(customPodcasts.userId, userId));
  await db.delete(userPodcasts).where(eq(userPodcasts.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
