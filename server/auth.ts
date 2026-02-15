import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser, getUser, setResetToken, getUserByResetToken, updatePassword, clearResetToken } from "./storage";
import { sendPasswordResetEmail } from "./email";

const tokenStore = new Map<
  string,
  {
    user: {
      id: string;
      email: string;
      firstName?: string | null;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function setupAuth(app: Express): Promise<void> {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName } = req.body;

      if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Valid email is required" });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      if (!firstName || !firstName.trim()) {
        return res.status(400).json({ error: "First name is required" });
      }

      const existing = await getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createUser(email.toLowerCase(), hashedPassword, firstName.trim());

      const token = generateToken();
      tokenStore.set(token, {
        user: { id: user.id, email: user.email, firstName: user.firstName },
        createdAt: Date.now(),
      });

      return res.json({
        token,
        user: { id: user.id, email: user.email, firstName: user.firstName },
      });
    } catch (err) {
      console.error("Registration error:", err);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = generateToken();
      tokenStore.set(token, {
        user: { id: user.id, email: user.email, firstName: user.firstName },
        createdAt: Date.now(),
      });

      return res.json({
        token,
        user: { id: user.id, email: user.email, firstName: user.firstName },
      });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed" });
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

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      const user = await getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.json({ success: true });
      }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      const hashedCode = crypto.createHash("sha256").update(resetCode).digest("hex");
      await setResetToken(user.id, hashedCode, expiry);

      try {
        await sendPasswordResetEmail(email.toLowerCase(), resetCode, user.firstName);
        console.log(`Password reset email sent to ${email}`);
      } catch (emailErr) {
        console.error("Failed to send reset email:", emailErr);
        return res.status(500).json({ error: "Failed to send reset email. Please try again later." });
      }

      return res.json({ success: true });
    } catch (err) {
      console.error("Forgot password error:", err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Email, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const hashedCode = crypto.createHash("sha256").update(code).digest("hex");
      const user = await getUserByResetToken(email.toLowerCase(), hashedCode);

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updatePassword(user.id, hashedPassword);
      await clearResetToken(user.id);

      return res.json({ success: true });
    } catch (err) {
      console.error("Reset password error:", err);
      return res.status(500).json({ error: "Something went wrong" });
    }
  });
}
