import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import { cityMiddleware } from "./city-middleware";
import * as fs from "fs";
import * as path from "path";
import * as net from "net";
import { spawn, execSync, type ChildProcess } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";
import { seedCitiesIfEmpty } from "./seed-cities";

const app = express();
app.set("trust proxy", 1);
const log = console.log;

app.get("/healthz", (_req, res) => res.status(200).send("ok"));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const METRO_PORT = 8081;
const isDev = process.env.NODE_ENV !== "production";
let metroProcess: ChildProcess | null = null;

function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      resolve(false);
    });
    socket.connect(port, "127.0.0.1");
  });
}

function killProcessOnPort(port: number) {
  try {
    const pids = execSync(`lsof -ti:${port} 2>/dev/null`).toString().trim();
    if (pids) {
      pids.split("\n").forEach((pid) => {
        try {
          process.kill(parseInt(pid), "SIGKILL");
        } catch {}
      });
      log(`[Metro] Killed stale process(es) on port ${port}`);
    }
  } catch {}
}

async function startMetroBundler(): Promise<void> {
  if (!isDev) return;

  const portBusy = await isPortInUse(METRO_PORT);
  if (portBusy) {
    log(`[Metro] Port ${METRO_PORT} is busy, killing stale processes...`);
    killProcessOnPort(METRO_PORT);
    await new Promise((r) => setTimeout(r, 2000));
  }

  log("[Metro] Starting bundler on port", METRO_PORT);

  const metro = spawn("npx", ["expo", "start", "--port", String(METRO_PORT), "--localhost"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "1",
      EXPO_NO_DOCTOR: "1",
      EXPO_OFFLINE: "1",
      EXPO_NO_TELEMETRY: "1",
      EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_DEV_DOMAIN}`,
      REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN || "0.0.0.0",
      EXPO_PUBLIC_DOMAIN: `${process.env.REPLIT_DEV_DOMAIN}`,
      EXPO_USE_FAST_RESOLVER: "1",
      EXPO_PUBLIC_FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "",
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
      EXPO_PUBLIC_FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "",
      EXPO_PUBLIC_CITY_ID: "amsterdam",
    },
    cwd: process.cwd(),
  });

  metroProcess = metro;

  metro.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) log("[Metro]", msg);
  });

  metro.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg && !msg.includes("DeprecationWarning")) log("[Metro:err]", msg);
  });

  metro.on("close", (code: number | null) => {
    log("[Metro] exited with code", code);
    metroProcess = null;
  });

  await new Promise<void>((resolve) => {
    const check = async () => {
      const ready = await isPortInUse(METRO_PORT);
      if (ready) {
        log("[Metro] Bundler is ready");
        resolve();
      } else {
        setTimeout(check, 1000);
      }
    };
    setTimeout(check, 3000);
    setTimeout(() => {
      log("[Metro] Timed out waiting for Metro, continuing anyway");
      resolve();
    }, 30000);
  });
}

function cleanupMetro() {
  if (metroProcess) {
    log("[Metro] Shutting down...");
    metroProcess.kill("SIGTERM");
    metroProcess = null;
  }
}

process.on("SIGINT", () => { cleanupMetro(); process.exit(0); });
process.on("SIGTERM", () => { cleanupMetro(); process.exit(0); });

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origin = req.header("origin");
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    } else {
      res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-City-Id, expo-platform, expo-runtime-version, expo-dev-client-id");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform || req.path === "/status" || req.path.endsWith(".bundle") || req.path.endsWith(".map")) {
      return next();
    }
    next();
  });

  app.use("/api", express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  app.use("/api", express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const reqPath = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!reqPath.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.status(200).send(html);
}

function setupMetroProxy(app: express.Application) {
  if (!isDev) return;

  const metroProxy = createProxyMiddleware({
    target: `http://127.0.0.1:${METRO_PORT}`,
    changeOrigin: true,
    ws: true,
    on: {
      error: (err, _req, res) => {
        log("[Proxy] Error:", (err as Error).message);
        if (res && "writeHead" in res && !("writableEnded" in res && (res as any).writableEnded)) {
          try {
            (res as any).writeHead(502);
            (res as any).end("Metro bundler not ready");
          } catch {}
        }
      },
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api") || req.path === "/healthz" || req.path === "/privacy-policy" || req.path.startsWith("/.well-known")) {
      return next();
    }

    if (req.path === "/" && !req.header("expo-platform")) {
      return next();
    }

    metroProxy(req, res, next);
  });

  log("[Proxy] Metro proxy configured -> port", METRO_PORT);
}

function configureStaticAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  let landingPageTemplate: string | null = null;
  try {
    landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  } catch {
    log("Landing page template not found, / will return simple response");
  }
  const appName = getAppName();

  app.get("/.well-known/apple-app-site-association", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.json({
      webcredentials: {
        apps: [
          "L9BR52LZ5P.app.replit.parisstories",
          "L9BR52LZ5P.app.replit.amsterdamstories",
        ]
      }
    });
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/" && !req.header("expo-platform")) {
      if (landingPageTemplate) {
        return serveLandingPage({
          req,
          res,
          landingPageTemplate,
          appName,
        });
      }
      return res.status(200).send(`<html><body><h1>${appName}</h1><p>Server is running</p></body></html>`);
    }
    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));

  if (!isDev) {
    app.use(express.static(path.resolve(process.cwd(), "static-build")));
  }
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });
}

(async () => {
  setupCors(app);
  setupRequestLogging(app);
  setupBodyParsing(app);

  app.use("/api", cityMiddleware);

  await seedCitiesIfEmpty();
  await setupAuth(app);

  setupMetroProxy(app);
  configureStaticAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    async () => {
      log(`Express server on port ${port}`);
      if (isDev) {
        await startMetroBundler();
        log(`Metro bundler proxied through Express on port ${port}`);
      }
    },
  );
})();
