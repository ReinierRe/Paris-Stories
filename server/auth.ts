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

function getServerBaseUrl(): string {
  const domain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0] || "";
  if (domain) return `https://${domain}`;
  return `http://localhost:5000`;
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
  app.get("/api/auth/google/start", (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_WEB_CLIENT_ID
      || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
      || "";
    const callbackUrl = `${getServerBaseUrl()}/api/auth/callback`;
    const state = crypto.randomBytes(16).toString("hex");

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: "code",
      scope: "openid profile email",
      state,
      access_type: "offline",
      prompt: "consent",
    });

    return res.json({
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      callbackUrl,
    });
  });

  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    try {
      const { code, error } = req.query;

      if (error || !code) {
        console.error("Google callback error:", error);
        return res.send(getRedirectHtml("myapp://auth?error=access_denied"));
      }

      const clientId = process.env.GOOGLE_WEB_CLIENT_ID
        || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
        || "";
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
      const callbackUrl = `${getServerBaseUrl()}/api/auth/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: "authorization_code",
        }).toString(),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("Google token exchange failed:", tokenRes.status, errBody);
        return res.send(getRedirectHtml("myapp://auth?error=token_exchange_failed"));
      }

      const tokens = (await tokenRes.json()) as { access_token: string };

      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!googleRes.ok) {
        console.error("Google userinfo failed:", googleRes.status);
        return res.send(getRedirectHtml("myapp://auth?error=userinfo_failed"));
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
      tokenStore.set(token, { user, createdAt: Date.now() });

      console.log(`User logged in: ${user.email}`);

      const userData = encodeURIComponent(JSON.stringify(user));
      return res.send(getRedirectHtml(`myapp://auth?token=${token}&user=${userData}`));
    } catch (err) {
      console.error("Google auth callback error:", err);
      return res.send(getRedirectHtml("myapp://auth?error=server_error"));
    }
  });

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    try {
      const { code, codeVerifier, redirectUri, accessToken } = req.body;

      let googleAccessToken = accessToken;

      if (code && codeVerifier && redirectUri) {
        const clientId = process.env.GOOGLE_WEB_CLIENT_ID
          || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
          || "";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";

        const params: Record<string, string> = {
          code,
          client_id: clientId,
          code_verifier: codeVerifier,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        };
        if (clientSecret) {
          params.client_secret = clientSecret;
        }
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(params).toString(),
        });

        if (!tokenRes.ok) {
          const errBody = await tokenRes.text();
          console.error("Google token exchange failed:", tokenRes.status, errBody);
          return res.status(401).json({ error: "Failed to exchange authorization code" });
        }
        const tokens = (await tokenRes.json()) as { access_token: string };
        googleAccessToken = tokens.access_token;
      }

      if (!googleAccessToken) {
        return res.status(400).json({ error: "Missing access token or authorization code" });
      }

      const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

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
      tokenStore.set(token, { user, createdAt: Date.now() });

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

function getRedirectHtml(deepLink: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Signing in...</title>
  <style>
    body { font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #1a1a2e; color: #fff; }
    .container { text-align: center; padding: 20px; }
    a { color: #d4a574; text-decoration: none; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <p>Signing you in...</p>
    <p><a id="link" href="${deepLink}">Tap here if you're not redirected</a></p>
  </div>
  <script>
    window.location.href = "${deepLink}";
  </script>
</body>
</html>`;
}
