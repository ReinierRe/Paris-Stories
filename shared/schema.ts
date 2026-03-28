import { sql } from "drizzle-orm";
import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const cities = pgTable("cities", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  appName: text("app_name").notNull(),
  bundleId: text("bundle_id").notNull(),
  contactEmail: text("contact_email").notNull(),
  privacyPolicyDate: text("privacy_policy_date").notNull(),
  localizedNames: jsonb("localized_names").notNull().$type<Record<string, string>>(),
  localizedCountry: jsonb("localized_country").notNull().$type<Record<string, string>>(),
  topLevelName: jsonb("top_level_name").notNull().$type<Record<string, string>>(),
  userLevels: jsonb("user_levels").notNull().$type<{
    id: string;
    icon: string;
    minPodcasts: number;
    name: Record<string, string>;
    description: Record<string, string>;
  }[]>(),
  roleDescription: jsonb("role_description").$type<Record<string, string>>(),
  moderationPromptTemplate: text("moderation_prompt_template"),
  moderationRejectTemplate: text("moderation_reject_template"),
  walkingTourPerspective: jsonb("walking_tour_perspective").$type<Record<string, string>>(),
  modernCulturePerspective: jsonb("modern_culture_perspective").$type<Record<string, string>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type City = typeof cities.$inferSelect;
export type InsertCity = typeof cities.$inferInsert;

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  cityId: varchar("city_id").notNull().default("paris").references(() => cities.id),
  email: text("email").notNull(),
  password: text("password"),
  firstName: text("first_name"),
  firebaseUid: text("firebase_uid"),
  preferredLanguage: text("preferred_language").notNull().default("nl"),
  preferredVoice: text("preferred_voice").notNull().default("female"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("users_email_city_idx").on(table.email, table.cityId),
  uniqueIndex("users_firebase_uid_city_idx").on(table.firebaseUid, table.cityId),
]);

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  firebaseUid: true,
  cityId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const cachedPodcasts = pgTable("cached_podcasts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  cityId: varchar("city_id").notNull().default("paris").references(() => cities.id),
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
    table.cityId,
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
  cityId: varchar("city_id").notNull().default("paris").references(() => cities.id),
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
  cityId: varchar("city_id").notNull().default("paris").references(() => cities.id),
  userId: text("user_id").notNull(),
  cachedPodcastId: text("cached_podcast_id").notNull(),
  topicName: text("topic_name").notNull(),
  topicNameNl: text("topic_name_nl").notNull().default(""),
  themeName: text("theme_name").notNull(),
  themeNameNl: text("theme_name_nl").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("user_podcast_lookup_idx").on(
    table.cityId,
    table.userId,
    table.cachedPodcastId
  ),
]);

export type UserPodcast = typeof userPodcasts.$inferSelect;
