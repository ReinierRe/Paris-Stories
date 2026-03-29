import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { getGoogleVoiceType } from "./google-tts";
import { requireAuth, type AuthenticatedRequest } from "./auth";
import * as fs from "fs";
import * as path from "path";
import express from "express";
import { eq, and, count } from "drizzle-orm";
import { db } from "./storage";
import { cachedPodcasts, customPodcasts, userPodcasts } from "@shared/schema";
import { desc } from "drizzle-orm";
import {
  getCuratedUserPrompt,
  getCustomUserPrompts,
  getModerationPrompt,
  getModerationRejectMessage,
  getPrivacyPolicyHtml,
} from "./city-prompts";
import { getCityFromRequest, getCityConfig } from "./city-middleware";
import {
  AUDIO_DIR,
  audioExistsInStorage,
  deleteAudioFromStorage,
  streamAudioFromStorage,
  renameAudioInStorage,
} from "./audio-storage";
import { generationJobs, generateId, checkRateLimit } from "./job-tracker";
import {
  getLanguageKey,
  getSystemPrompt,
  getSiblingAngles,
  resolveCustomPerspectiveText,
  resolvePerspectiveText,
  getCustomSiblingAngles,
} from "./prompts";
import { generateScriptAndAudio, generatePodcastTitle, moderateContent } from "./generation";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/city/config", (req: Request, res: Response) => {
    const { cityConfig } = getCityFromRequest(req);
    res.json({
      id: cityConfig.id,
      name: cityConfig.name,
      country: cityConfig.country,
      appName: cityConfig.appName,
      bundleId: cityConfig.bundleId,
      contactEmail: cityConfig.contactEmail,
      privacyPolicyDate: cityConfig.privacyPolicyDate,
      localizedNames: cityConfig.localizedNames,
      localizedCountry: cityConfig.localizedCountry,
      topLevelName: cityConfig.topLevelName,
      userLevels: cityConfig.userLevels,
    });
  });

  app.use("/api/podcast/audio", express.static(AUDIO_DIR));

  app.get("/api/podcast/audio-stream/:filename", async (req: Request, res: Response) => {
    const filename = req.params.filename as string;
    if (!filename) {
      return res.status(400).json({ error: "Missing filename" });
    }

    const localPath = path.join(AUDIO_DIR, filename);
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }

    const cityIdParam = (req.query.city as string) || req.headers["x-city-id"] as string || "paris";
    const streamed = await streamAudioFromStorage(cityIdParam, filename, res);
    if (!streamed) {
      return res.status(404).json({ error: "Audio not found" });
    }
  });

  app.get("/api/podcast/job/:jobId", requireAuth, (req: Request, res: Response) => {
    const jobId = req.params.jobId as string;
    const job = generationJobs.get(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    const userId = (req as AuthenticatedRequest).user?.id;
    const { cityId } = getCityFromRequest(req);
    if (job.userId !== userId || job.cityId !== cityId) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json({
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
    });
  });

  app.post("/api/podcast/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { topicId, topicName, topicNameNl, themeName, themeNameNl, perspective, voice, language, wordCount, lengthId } = req.body;
      const userId = (req as AuthenticatedRequest).user?.id;
      const { cityId, cityConfig } = getCityFromRequest(req);

      if (!topicName || !voice || !language) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (userId && !checkRateLimit(userId)) {
        return res.status(429).json({ error: "Je hebt het maximum aantal podcasts per uur bereikt. Probeer het later opnieuw." });
      }

      const cacheAngle = perspective || "";
      const cacheLength = lengthId || "medium";

      if (topicId) {
        const [cached] = await db
          .select()
          .from(cachedPodcasts)
          .where(
            and(
              eq(cachedPodcasts.cityId, cityId),
              eq(cachedPodcasts.topicId, topicId),
              eq(cachedPodcasts.angle, cacheAngle),
              eq(cachedPodcasts.voice, voice),
              eq(cachedPodcasts.language, language),
              eq(cachedPodcasts.length, cacheLength)
            )
          );

        if (cached) {
          const audioPath = path.join(AUDIO_DIR, cached.audioFilename);
          const localExists = fs.existsSync(audioPath);
          const storageExists = !localExists ? await audioExistsInStorage(cityId, cached.audioFilename) : false;
          if (localExists || storageExists) {
            console.log(`Cache hit for "${topicName}" [${cacheAngle || "no angle"}/${voice}/${language}/${cacheLength}]`);

            if (userId) {
              try {
                await db.insert(userPodcasts).values({
                  cityId,
                  userId,
                  cachedPodcastId: cached.id,
                  topicName: topicName || "",
                  topicNameNl: topicNameNl || topicName || "",
                  themeName: themeName || "",
                  themeNameNl: themeNameNl || themeName || "",
                }).onConflictDoNothing();
              } catch (e) {
                console.error("Failed to save user-podcast link:", e);
              }
            }

            return res.json({
              status: "ready",
              result: {
                id: cached.id,
                script: cached.script,
                audioUrl: `/api/podcast/audio-stream/${cached.audioFilename}`,
                durationSeconds: cached.durationSeconds,
                cached: true,
              },
            });
          }
        }
      }

      const jobId = generateId();
      generationJobs.set(jobId, {
        userId,
        cityId,
        status: "generating",
        progress: "Starting...",
        createdAt: Date.now(),
      });

      res.json({ jobId, status: "generating" });

      const googleVoiceType = getGoogleVoiceType(voice, language);
      const langKey = getLanguageKey(language);
      const siblingAngles = getSiblingAngles(topicId, perspective, language, cityConfig);
      const perspectiveText = resolvePerspectiveText(perspective, langKey, cityConfig);
      const systemPrompt = getSystemPrompt({
        language,
        perspectiveText,
        wordCount: wordCount || 750,
        googleVoiceType,
        siblingAngles,
        city: cityConfig,
      });
      const userPrompt = getCuratedUserPrompt(cityConfig, language, topicName, themeName);

      generateScriptAndAudio({
        cityId,
        systemPrompt,
        userPrompt,
        voice,
        language,
        topicName,
        jobId,
        googleVoiceType,
      }).then(async ({ script, filename, durationSeconds }) => {
        let cachedId = jobId;
        if (topicId) {
          try {
            const [inserted] = await db.insert(cachedPodcasts).values({
              cityId,
              topicId,
              angle: cacheAngle,
              voice,
              language,
              length: cacheLength,
              script,
              audioFilename: filename,
              durationSeconds,
            }).returning();
            cachedId = inserted.id;
            console.log(`Cached podcast for "${topicName}"`);
          } catch (cacheErr) {
            console.error("Failed to cache podcast:", cacheErr);
          }
        }

        if (userId && topicId) {
          try {
            await db.insert(userPodcasts).values({
              cityId,
              userId,
              cachedPodcastId: cachedId,
              topicName: topicName || "",
              topicNameNl: topicNameNl || topicName || "",
              themeName: themeName || "",
              themeNameNl: themeNameNl || themeName || "",
            }).onConflictDoNothing();
          } catch (e) {
            console.error("Failed to save user-podcast link:", e);
          }
        }

        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "ready";
          job.result = {
            id: cachedId,
            script,
            audioUrl: `/api/podcast/audio-stream/${filename}`,
            durationSeconds,
            cached: false,
          };
        }
      }).catch((error) => {
        console.error("Error generating podcast:", error);
        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "error";
          job.error = "Failed to generate podcast";
        }
      });
    } catch (error) {
      console.error("Error starting podcast generation:", error);
      res.status(500).json({ error: "Failed to start podcast generation" });
    }
  });

  app.post("/api/podcast/generate-custom", requireAuth, async (req: Request, res: Response) => {
    try {
      const { subject, angle, voice, language, wordCount, lengthId } = req.body;
      const userId = (req as AuthenticatedRequest).user?.id;
      const { cityId, cityConfig } = getCityFromRequest(req);

      if (!subject || !angle || !voice || !language || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const MAX_FREE_CUSTOM_PODCASTS = 5;
      const [{ value: customCount }] = await db.select({ value: count() })
        .from(customPodcasts)
        .where(and(eq(customPodcasts.userId, userId), eq(customPodcasts.cityId, cityId)));
      if (customCount >= MAX_FREE_CUSTOM_PODCASTS) {
        return res.status(403).json({
          error: "You have reached the maximum of 5 free custom podcasts.",
          code: "CUSTOM_LIMIT_REACHED",
          customCount,
          customLimit: MAX_FREE_CUSTOM_PODCASTS,
        });
      }

      try {
        const moderationResult = await moderateContent(getModerationPrompt(cityConfig, subject));
        if (moderationResult !== "ALLOW") {
          return res.status(400).json({ error: getModerationRejectMessage(cityConfig) });
        }
      } catch (modErr) {
        console.error("Content moderation check failed:", modErr);
        return res.status(500).json({ error: "Unable to verify your topic right now. Please try again in a moment." });
      }

      const customLangKey = getLanguageKey(language);
      const angleText = resolveCustomPerspectiveText(angle, customLangKey, cityConfig);

      const customGoogleVoiceType = getGoogleVoiceType(voice, language);

      const customSiblingAngles = getCustomSiblingAngles(angle, language);

      const systemPrompt = getSystemPrompt({
        language,
        perspectiveText: angleText,
        wordCount: wordCount || 400,
        googleVoiceType: customGoogleVoiceType,
        siblingAngles: customSiblingAngles,
        city: cityConfig,
      });

      const customUserPrompts = getCustomUserPrompts(cityConfig, customLangKey, subject);
      const userPrompt = customUserPrompts[customLangKey] || customUserPrompts.en;

      const jobId = generateId();
      generationJobs.set(jobId, {
        userId,
        cityId,
        status: "generating",
        progress: "Starting...",
        createdAt: Date.now(),
      });

      console.log(`Generating custom podcast for user ${userId}: "${subject}" [${angle}/${voice}/${language}]...`);

      res.json({ jobId, status: "generating" });

      generateScriptAndAudio({
        cityId,
        systemPrompt,
        userPrompt,
        voice,
        language,
        topicName: subject,
        jobId,
        googleVoiceType: customGoogleVoiceType,
      }).then(async ({ script, filename, durationSeconds }) => {
        const finalFilename = await renameAudioInStorage(cityId, filename, `custom_${filename}`);

        let generatedTitle = subject;
        try {
          generatedTitle = await generatePodcastTitle(subject, language);
        } catch (titleErr) {
          console.error("Failed to generate title, using subject:", titleErr);
        }

        const id = generateId();
        const [saved] = await db.insert(customPodcasts).values({
          id,
          cityId,
          userId,
          subject,
          title: generatedTitle,
          angle,
          voice,
          language,
          length: lengthId || "short",
          script,
          audioFilename: finalFilename,
          durationSeconds,
        }).returning();

        console.log(`Custom podcast "${generatedTitle}" ready for user ${userId} (${durationSeconds}s)`);

        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "ready";
          job.result = {
            id: saved.id,
            title: saved.title,
            subject: saved.subject,
            script: saved.script,
            audioUrl: `/api/podcast/audio-stream/${saved.audioFilename}`,
            durationSeconds: saved.durationSeconds,
            angle: saved.angle,
            voice: saved.voice,
            language: saved.language,
            length: saved.length,
            createdAt: saved.createdAt?.toISOString(),
            customDbId: saved.id,
            cached: false,
          };
        }
      }).catch((error) => {
        console.error("Error generating custom podcast:", error);
        const job = generationJobs.get(jobId);
        if (job) {
          job.status = "error";
          job.error = "Failed to generate custom podcast";
        }
      });
    } catch (error) {
      console.error("Error starting custom podcast generation:", error);
      res.status(500).json({ error: "Failed to start custom podcast generation" });
    }
  });

  app.get("/api/podcast/custom-limit", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      const { cityId } = getCityFromRequest(req);

      const MAX_FREE_CUSTOM_PODCASTS = 5;
      const [{ value: customCount }] = await db.select({ value: count() })
        .from(customPodcasts)
        .where(and(eq(customPodcasts.userId, userId), eq(customPodcasts.cityId, cityId)));

      res.json({
        customCount,
        customLimit: MAX_FREE_CUSTOM_PODCASTS,
        remaining: Math.max(0, MAX_FREE_CUSTOM_PODCASTS - customCount),
      });
    } catch (error) {
      console.error("Error fetching custom limit:", error);
      res.status(500).json({ error: "Failed to fetch custom podcast limit" });
    }
  });

  app.get("/api/podcast/custom", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const { cityId } = getCityFromRequest(req);
      const results = await db
        .select()
        .from(customPodcasts)
        .where(and(eq(customPodcasts.userId, userId), eq(customPodcasts.cityId, cityId)))
        .orderBy(desc(customPodcasts.createdAt));

      const needsTitle = results.filter((p) => !p.title || p.title === p.subject);
      const toRegenerate = needsTitle.slice(0, 3);

      for (const p of toRegenerate) {
        try {
          p.title = await generatePodcastTitle(p.subject, p.language);
          await db.update(customPodcasts).set({ title: p.title }).where(eq(customPodcasts.id, p.id));
        } catch {
          p.title = p.subject.length > 60 ? p.subject.substring(0, 57) + "..." : p.subject;
          await db.update(customPodcasts).set({ title: p.title }).where(eq(customPodcasts.id, p.id)).catch(() => {});
        }
      }

      const podcasts = results.map((p) => ({
        id: p.id,
        title: p.title || p.subject,
        subject: p.subject,
        script: p.script,
        audioUrl: `/api/podcast/audio-stream/${p.audioFilename}`,
        durationSeconds: p.durationSeconds,
        angle: p.angle,
        voice: p.voice,
        language: p.language,
        length: p.length,
        createdAt: p.createdAt,
      }));

      res.json({ podcasts });
    } catch (error) {
      console.error("Error fetching custom podcasts:", error);
      res.status(500).json({ error: "Failed to fetch custom podcasts" });
    }
  });

  app.get("/api/podcast/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const { cityId } = getCityFromRequest(req);

      const genericResults = await db
        .select({
          userPodcast: userPodcasts,
          cached: cachedPodcasts,
        })
        .from(userPodcasts)
        .innerJoin(cachedPodcasts, eq(userPodcasts.cachedPodcastId, cachedPodcasts.id))
        .where(and(eq(userPodcasts.userId, userId), eq(userPodcasts.cityId, cityId)))
        .orderBy(desc(userPodcasts.createdAt));

      const genericPodcasts = genericResults
        .map((r) => ({
          id: r.cached.id,
          title: r.userPodcast.topicName,
          titleNl: r.userPodcast.topicNameNl,
          theme: r.userPodcast.themeName,
          themeNl: r.userPodcast.themeNameNl,
          script: r.cached.script,
          audioUrl: `/api/podcast/audio-stream/${r.cached.audioFilename}`,
          durationSeconds: r.cached.durationSeconds,
          voice: r.cached.voice,
          language: r.cached.language,
          perspective: r.cached.angle,
          length: r.cached.length,
          createdAt: r.userPodcast.createdAt?.toISOString() || new Date().toISOString(),
          isCustom: false,
        }));

      const customResults = await db
        .select()
        .from(customPodcasts)
        .where(and(eq(customPodcasts.userId, userId), eq(customPodcasts.cityId, cityId)))
        .orderBy(desc(customPodcasts.createdAt));

      const customPodcastsList = customResults
        .map((p) => ({
          id: p.id,
          title: p.title || p.subject,
          titleNl: p.title || p.subject,
          subject: p.subject,
          theme: "Custom",
          themeNl: "Eigen",
          script: p.script,
          audioUrl: `/api/podcast/audio-stream/${p.audioFilename}`,
          durationSeconds: p.durationSeconds,
          voice: p.voice,
          language: p.language,
          perspective: p.angle,
          length: p.length,
          createdAt: p.createdAt?.toISOString() || new Date().toISOString(),
          isCustom: true,
          customDbId: p.id,
        }));

      const allPodcasts = [...genericPodcasts, ...customPodcastsList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({ podcasts: allPodcasts });
    } catch (error) {
      console.error("Error fetching podcast history:", error);
      res.status(500).json({ error: "Failed to fetch podcast history" });
    }
  });

  app.delete("/api/podcast/custom/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      const podcastId = req.params.id as string;
      const { cityId } = getCityFromRequest(req);

      const [podcast] = await db
        .select()
        .from(customPodcasts)
        .where(and(eq(customPodcasts.id, podcastId), eq(customPodcasts.userId, userId), eq(customPodcasts.cityId, cityId)));

      if (!podcast) {
        return res.status(404).json({ error: "Podcast not found" });
      }

      const audioPath = path.join(AUDIO_DIR, podcast.audioFilename);
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
      await deleteAudioFromStorage(cityId, podcast.audioFilename);

      await db.delete(customPodcasts).where(eq(customPodcasts.id, podcastId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom podcast:", error);
      res.status(500).json({ error: "Failed to delete custom podcast" });
    }
  });

  app.get("/privacy-policy", async (req: Request, res: Response) => {
    const queryCityId = (req.query.city as string) || "paris";
    const city = await getCityConfig(queryCityId);
    if (!city) {
      return res.status(404).send("City not found");
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(getPrivacyPolicyHtml(city));
  });

  const httpServer = createServer(app);
  return httpServer;
}
