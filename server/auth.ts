import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";

const tokenStore = new Map<
  string,
  {
    user: {
      id: string;
      email?: string;
      firstName?: string;
      profileImageUrl?: string;
    };
    createdAt: number;
  }
>();

setInterval(() => {
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  for (const [token, data] of tokenStore) {
    if (now - data.createdAt > maxAge) {
      tokenStore.delete(token);
    }
  }
}, 60 * 60 * 1000);

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const session = tokenStore.get(token);
    if (session) {
      (req as any).user = session.user;
      return next();
    }
  }
  return res.status(401).json({ error: "Authentication required" });
}

export async function setupAuth(app: Express): Promise<void> {
  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({ error: "Missing access token" });
      }

      const googleRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!googleRes.ok) {
        console.error("Google userinfo failed:", googleRes.status);
        return res.status(401).json({ error: "Invalid Google token" });
      }

      const googleUser = (await googleRes.json()) as {
        sub: string;
        email?: string;
        name?: string;
        given_name?: string;
        picture?: string;
      };

      const user = {
        id: googleUser.sub,
        email: googleUser.email,
        firstName: googleUser.given_name || googleUser.name,
        profileImageUrl: googleUser.picture,
      };

      const token = generateToken();
      tokenStore.set(token, {
        user,
        createdAt: Date.now(),
      });

      console.log(`User logged in: ${user.email}`);

      return res.json({ token, user });
    } catch (err) {
      console.error("Google auth error:", err);
      return res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.get("/api/auth/me", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const session = tokenStore.get(token);
      if (session) {
        return res.json({ user: session.user });
      }
    }
    return res.status(401).json({ error: "Not authenticated" });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      tokenStore.delete(token);
    }
    return res.json({ success: true });
  });
}
