import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const cachedPodcasts = pgTable("cached_podcasts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  topicId: text("topic_id").notNull(),
  angle: text("angle").notNull().default(""),
  voice: text("voice").notNull(),
  language: text("language").notNull(),
  length: text("length").notNull(),
  script: text("script").notNull(),
  audioFilename: text("audio_filename").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("cached_podcast_lookup_idx").on(
    table.topicId,
    table.angle,
    table.voice,
    table.language,
    table.length
  ),
]);

export type CachedPodcast = typeof cachedPodcasts.$inferSelect;
