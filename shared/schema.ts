import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  firstName: text("first_name"),
  firebaseUid: text("firebase_uid").unique(),
  preferredLanguage: text("preferred_language").notNull().default("nl"),
  preferredVoice: text("preferred_voice").notNull().default("female"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  firebaseUid: true,
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

export const customPodcasts = pgTable("custom_podcasts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull().default(""),
  angle: text("angle").notNull(),
  voice: text("voice").notNull(),
  language: text("language").notNull(),
  length: text("length").notNull(),
  script: text("script").notNull(),
  audioFilename: text("audio_filename").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CustomPodcast = typeof customPodcasts.$inferSelect;

export const userPodcasts = pgTable("user_podcasts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  cachedPodcastId: text("cached_podcast_id").notNull(),
  topicName: text("topic_name").notNull(),
  topicNameNl: text("topic_name_nl").notNull().default(""),
  themeName: text("theme_name").notNull(),
  themeNameNl: text("theme_name_nl").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("user_podcast_lookup_idx").on(
    table.userId,
    table.cachedPodcastId
  ),
]);

export type UserPodcast = typeof userPodcasts.$inferSelect;
