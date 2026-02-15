import { eq, and, gt } from "drizzle-orm";
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

export async function createUser(
  email: string,
  hashedPassword: string,
  firstName?: string,
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ email, password: hashedPassword, firstName: firstName || null })
    .returning();
  return user;
}

export async function setResetToken(userId: string, hashedToken: string, expiry: Date): Promise<void> {
  await db.update(users).set({ resetToken: hashedToken, resetTokenExpiry: expiry }).where(eq(users.id, userId));
}

export async function getUserByResetToken(email: string, hashedToken: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(
    and(
      eq(users.email, email),
      eq(users.resetToken, hashedToken),
      gt(users.resetTokenExpiry, new Date())
    )
  );
  return user;
}

export async function updatePassword(userId: string, hashedPassword: string): Promise<void> {
  await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
}

export async function clearResetToken(userId: string): Promise<void> {
  await db.update(users).set({ resetToken: null, resetTokenExpiry: null }).where(eq(users.id, userId));
}
