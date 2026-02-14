import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
app.set("trust proxy", 1);
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

const METRO_PORT = 8081;
const isDev = process.env.NODE_ENV !== "production";

function startMetroBundler() {
  if (!isDev) return;

  log("Starting Metro bundler on port", METRO_PORT);

  const metro = spawn("npx", ["expo", "start", "--port", String(METRO_PORT), "--localhost"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      CI: "1",
      EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_DEV_DOMAIN}`,
      REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN || "0.0.0.0",
      EXPO_PUBLIC_DOMAIN: `${process.env.REPLIT_DEV_DOMAIN}`,
      EXPO_USE_FAST_RESOLVER: "1",
    },
    cwd: process.cwd(),
  });

  metro.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) log("[Metro]", msg);
  });

  metro.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) log("[Metro:err]", msg);
  });

  metro.on("close", (code: number | null) => {
    log("[Metro] exited with code", code);
  });

  return metro;
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    const origins = new Set<string>();

    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }

    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }

    const origin = req.header("origin");

    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    if (origin && (origins.has(origin) || isLocalhost)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.use(express.urlencoded({ extended: false }));
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

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

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
      error: (err) => {
        log("[Proxy] Metro not ready yet:", (err as Error).message);
      },
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    const platform = req.header("expo-platform");
    const isExpoDev = req.header("expo-dev-client-id") ||
                      req.header("expo-runtime-version") ||
                      platform;

    if (isExpoDev) {
      return metroProxy(req, res, next);
    }

    if (req.path === "/status" ||
        req.path === "/inspector" ||
        req.path === "/debugger-ui" ||
        req.path === "/json" ||
        req.path === "/json/list" ||
        req.path.startsWith("/logs") ||
        req.path.startsWith("/hot") ||
        req.path.startsWith("/symbolicate") ||
        req.path.startsWith("/.expo") ||
        req.path.endsWith(".bundle") ||
        req.path.endsWith(".map") ||
        req.path.includes("__metro")) {
      return metroProxy(req, res, next);
    }

    next();
  });

  log("Metro proxy configured for dev mode -> port", METRO_PORT);
}

function configureStaticAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    if (req.path === "/") {
      const platform = req.header("expo-platform");
      if (!platform) {
        return serveLandingPage({
          req,
          res,
          landingPageTemplate,
          appName,
        });
      }
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
  if (isDev) {
    startMetroBundler();
  }

  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

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
    () => {
      log(`Express server on port ${port}`);
      if (isDev) {
        log(`Metro bundler starting on port ${METRO_PORT}, proxied through Express`);
      }
    },
  );
})();
