import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { users, type User } from "@shared/schema";

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
