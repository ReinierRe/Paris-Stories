import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import * as client from "openid-client";
import crypto from "crypto";

const OIDC_ISSUER = "https://replit.com/oidc";

let oidcConfig: client.Configuration | null = null;

const tokenStore = new Map<
  string,
  {
    user: {
      id: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
      username?: string;
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

function getRedirectUri(): string {
  const domain =
    process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS?.split(",")[0];
  if (!domain) {
    throw new Error("No Replit domain configured");
  }
  return `https://${domain}/api/auth/callback`;
}

async function initOIDC(): Promise<void> {
  const clientId = process.env.REPLIT_AUTH_CLIENT_ID || process.env.REPL_ID;

  if (!clientId) {
    console.warn("No OIDC client ID available. Auth will not work.");
    return;
  }

  const clientSecret = process.env.REPLIT_AUTH_CLIENT_SECRET;

  try {
    if (clientSecret) {
      oidcConfig = await client.discovery(
        new URL(OIDC_ISSUER),
        clientId,
        clientSecret,
      );
    } else {
      oidcConfig = await client.discovery(
        new URL(OIDC_ISSUER),
        clientId,
      );
    }
    console.log("OpenID Connect configured with Replit Auth (client:", clientId.slice(0, 8) + "...)");
  } catch (err) {
    console.error("Failed to initialize OIDC:", err);
  }
}

declare module "express-session" {
  interface SessionData {
    codeVerifier?: string;
    nonce?: string;
    returnTo?: string;
  }
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
  app.use(
    session({
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: "lax" as const,
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
  );

  await initOIDC();

  app.get("/api/auth/login", async (req: Request, res: Response) => {
    if (!oidcConfig) {
      return res
        .status(503)
        .json({ error: "Auth not configured. Server could not initialize OIDC." });
    }

    try {
      const returnTo = (req.query.returnTo as string) || undefined;
      const codeVerifier = client.randomPKCECodeVerifier();
      const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
      const nonce = client.randomNonce();

      req.session.codeVerifier = codeVerifier;
      req.session.nonce = nonce;
      req.session.returnTo = returnTo;

      const redirectUri = getRedirectUri();

      const params: Record<string, string> = {
        redirect_uri: redirectUri,
        scope: "openid email profile",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        response_type: "code",
        nonce,
      };

      const authUrl = client.buildAuthorizationUrl(oidcConfig, params);
      res.redirect(authUrl.href);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Failed to initiate login" });
    }
  });

  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    if (!oidcConfig) {
      return res.status(503).json({ error: "Auth not configured" });
    }

    try {
      const redirectUri = getRedirectUri();
      const codeVerifier = req.session.codeVerifier;

      if (!codeVerifier) {
        console.error("Auth callback: Missing code verifier. Session ID:", req.sessionID, "Session data:", JSON.stringify(req.session));
        return res.status(400).json({ error: "Missing code verifier in session. Please try logging in again." });
      }

      const currentUrl = new URL(
        req.originalUrl,
        `https://${req.headers.host}`,
      );

      const tokens = await client.authorizationCodeGrant(
        oidcConfig,
        currentUrl,
        {
          pkceCodeVerifier: codeVerifier,
          expectedNonce: req.session.nonce,
          idTokenExpected: true,
        },
        {
          redirect_uri: redirectUri,
        },
      );

      const claims = tokens.claims();
      if (!claims) {
        return res.status(500).json({ error: "Failed to get user claims" });
      }

      const userInfo: any = {
        id: claims.sub,
      };

      try {
        const info = await client.fetchUserInfo(
          oidcConfig,
          tokens.access_token,
          claims.sub,
        );
        userInfo.email = info.email;
        userInfo.firstName = info.first_name as string;
        userInfo.lastName = info.last_name as string;
        userInfo.profileImageUrl = info.profile_image_url as string;
        userInfo.username = info.username as string;
      } catch {
        userInfo.email = (claims as any).email;
        userInfo.firstName = (claims as any).first_name;
        userInfo.lastName = (claims as any).last_name;
        userInfo.username = (claims as any).username;
      }

      const token = generateToken();
      tokenStore.set(token, {
        user: userInfo,
        createdAt: Date.now(),
      });

      delete req.session.codeVerifier;
      delete req.session.nonce;

      const returnTo = req.session.returnTo;
      delete req.session.returnTo;

      if (returnTo) {
        const returnUrl = new URL(returnTo);
        returnUrl.searchParams.set("token", token);
        return res.redirect(returnUrl.href);
      }

      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Login Successful</title></head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_TOKEN', token: '${token}' }, '*');
            }
            document.body.innerHTML = '<h2 style="font-family:sans-serif;text-align:center;margin-top:40vh">Login successful! You can close this window.</h2>';
          </script>
        </body>
        </html>
      `);
    } catch (err) {
      console.error("Auth callback error:", err);
      res.status(500).json({ error: "Authentication failed" });
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
    req.session.destroy(() => {});
    res.json({ success: true });
  });
}
