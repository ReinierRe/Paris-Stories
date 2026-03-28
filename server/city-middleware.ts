import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "./storage";
import { cities, type City } from "@shared/schema";

const cityCache = new Map<string, { city: City; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getCityConfig(cityId: string): Promise<City | null> {
  const cached = cityCache.get(cityId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.city;
  }

  const [city] = await db.select().from(cities).where(eq(cities.id, cityId));
  if (city) {
    cityCache.set(cityId, { city, cachedAt: Date.now() });
  }
  return city || null;
}

export function clearCityCache(): void {
  cityCache.clear();
}

export async function cityMiddleware(req: Request, res: Response, next: NextFunction) {
  const cityId = (req.headers["x-city-id"] as string) || "paris";

  const city = await getCityConfig(cityId);
  if (!city) {
    return res.status(400).json({ error: `Unknown city: ${cityId}` });
  }

  (req as any).cityId = city.id;
  (req as any).cityConfig = city;
  return next();
}

export function getCityFromRequest(req: Request): { cityId: string; cityConfig: City } {
  return {
    cityId: (req as any).cityId || "paris",
    cityConfig: (req as any).cityConfig,
  };
}
