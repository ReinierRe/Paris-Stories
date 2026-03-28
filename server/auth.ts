import type { Express, Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { getUserByFirebaseUid, getUserByEmail, createFirebaseUser, deleteUserAndData, getUserCustomPodcastAudioFiles, updateUserPreferences, countUserCityAccounts } from "./storage";
import { getCityFromRequest } from "./city-middleware";

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required. Add your Firebase service account JSON to secrets.");
}

let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (e) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON. Please check the value in your secrets.");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { cityId } = getCityFromRequest(req);
  const token = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    let user = await getUserByFirebaseUid(decoded.uid, cityId);

    if (!user) {
      const email = decoded.email;
      if (email) {
        user = await getUserByEmail(email, cityId);
        if (!user) {
          user = await createFirebaseUser(email, decoded.uid, cityId, decoded.name);
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = { id: user.id, email: user.email, firstName: user.firstName, preferredLanguage: user.preferredLanguage, preferredVoice: user.preferredVoice };
    return next();
  } catch (err) {
    console.error("Auth verification error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function setupAuth(app: Express): Promise<void> {
  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ error: "ID token is required" });
      }

      const { cityId } = getCityFromRequest(req);
      const decoded = await admin.auth().verifyIdToken(idToken);
      let user = await getUserByFirebaseUid(decoded.uid, cityId);

      if (!user) {
        const email = decoded.email;
        if (!email) {
          return res.status(400).json({ error: "Email not available from Firebase" });
        }

        user = await getUserByEmail(email, cityId);
        if (user) {
          const { db } = await import("./storage");
          const { users } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(users).set({ firebaseUid: decoded.uid }).where(eq(users.id, user.id));
          user = { ...user, firebaseUid: decoded.uid };
        } else {
          user = await createFirebaseUser(email, decoded.uid, cityId, decoded.name);
        }
      }

      return res.json({
        user: { id: user.id, email: user.email, firstName: user.firstName, preferredLanguage: user.preferredLanguage, preferredVoice: user.preferredVoice },
      });
    } catch (err) {
      console.error("Verify error:", err);
      return res.status(401).json({ error: "Invalid token" });
    }
  });

  app.get("/api/auth/me", requireAuth, (req: Request, res: Response) => {
    return res.json({ user: (req as any).user });
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    return res.json({ success: true });
  });

  app.patch("/api/auth/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { preferredLanguage, preferredVoice } = req.body;

      const validLanguages = ["nl", "en", "fr", "de", "es"];
      const validVoices = ["male", "female"];

      if (preferredLanguage && !validLanguages.includes(preferredLanguage)) {
        return res.status(400).json({ error: "Invalid language" });
      }
      if (preferredVoice && !validVoices.includes(preferredVoice)) {
        return res.status(400).json({ error: "Invalid voice" });
      }

      const updated = await updateUserPreferences(user.id, { preferredLanguage, preferredVoice });
      return res.json({
        user: { id: updated!.id, email: updated!.email, firstName: updated!.firstName, preferredLanguage: updated!.preferredLanguage, preferredVoice: updated!.preferredVoice },
      });
    } catch (err) {
      console.error("Update preferences error:", err);
      return res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  app.delete("/api/auth/account", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      const { cityId } = getCityFromRequest(req);
      const audioFiles = await getUserCustomPodcastAudioFiles(user.id);
      if (audioFiles.length > 0) {
        const { deleteAudioFiles } = await import("./audio-cleanup");
        await deleteAudioFiles(audioFiles, cityId);
      }

      const firebaseUid = user.firebaseUid;
      await deleteUserAndData(user.id);

      const remainingAccounts = await countUserCityAccounts(firebaseUid);
      if (remainingAccounts === 0) {
        try {
          await admin.auth().deleteUser(firebaseUid);
        } catch (fbErr) {
          console.warn("Could not delete Firebase user:", fbErr);
        }
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("Delete account error:", err);
      return res.status(500).json({ error: "Failed to delete account" });
    }
  });
}
