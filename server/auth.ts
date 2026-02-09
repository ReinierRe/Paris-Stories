import type { Express, Request, Response, NextFunction } from "express";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.slice(7);

  getAuth()
    .verifyIdToken(token)
    .then((claims) => {
      (req as any).user = {
        id: claims.uid,
        email: claims.email,
        firstName: claims.name,
      };
      next();
    })
    .catch(() => {
      return res.status(401).json({ error: "Invalid or expired token" });
    });
}

export async function setupAuth(app: Express): Promise<void> {
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.slice(7);

    try {
      const claims = await getAuth().verifyIdToken(token);
      return res.json({
        user: {
          id: claims.uid,
          email: claims.email,
          firstName: claims.name,
        },
      });
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  });

  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    return res.json({ success: true });
  });
}
