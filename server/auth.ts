import type { Express, Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import { getUserByFirebaseUid, getUserByEmail, createFirebaseUser } from "./storage";

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required. Add your Firebase service account JSON to secrets.");
}

let serviceAccount: admin.ServiceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (e) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON. Please check the value in your secrets.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    let user = await getUserByFirebaseUid(decoded.uid);

    if (!user) {
      const email = decoded.email;
      if (email) {
        user = await getUserByEmail(email);
        if (!user) {
          user = await createFirebaseUser(email, decoded.uid, decoded.name);
        }
      }
    }

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = { id: user.id, email: user.email, firstName: user.firstName };
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

      const decoded = await admin.auth().verifyIdToken(idToken);
      let user = await getUserByFirebaseUid(decoded.uid);

      if (!user) {
        const email = decoded.email;
        if (!email) {
          return res.status(400).json({ error: "Email not available from Firebase" });
        }

        user = await getUserByEmail(email);
        if (user) {
          const { db } = await import("./storage");
          const { users } = await import("@shared/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(users).set({ firebaseUid: decoded.uid }).where(eq(users.id, user.id));
          user = { ...user, firebaseUid: decoded.uid };
        } else {
          user = await createFirebaseUser(email, decoded.uid, decoded.name);
        }
      }

      return res.json({
        user: { id: user.id, email: user.email, firstName: user.firstName },
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
}
