import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { useAuth } from "@/contexts/AuthContext";
import { useCityConfig } from "@/contexts/CityConfigContext";
import { apiRequest, getApiUrl, getCityHeaders, buildCityHeaders } from "@/lib/query-client";

export function resolveAudioUrl(audioUrl: string, cityIdOverride?: string): string {
  if (!audioUrl) return "";
  const cityId = cityIdOverride || getCityHeaders()["X-City-Id"] || "amsterdam";
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    try {
      const url = new URL(audioUrl);
      const resolved = new URL(url.pathname, getApiUrl());
      resolved.searchParams.set("city", cityId);
      return resolved.toString();
    } catch {
      return audioUrl;
    }
  }
  const resolved = new URL(audioUrl, getApiUrl());
  resolved.searchParams.set("city", cityId);
  return resolved.toString();
}

export interface Podcast {
  id: string;
  title: string;
  titleNl: string;
  subject?: string;
  theme: string;
  themeNl: string;
  script: string;
  audioUrl: string;
  language: "en" | "nl" | "fr" | "de";
  voice: "male" | "female";
  perspective: string;
  length: string;
  durationSeconds?: number;
  status: "generating" | "ready" | "error";
  createdAt: string;
  errorMessage?: string;
  isCustom?: boolean;
  customDbId?: string;
  /** City this podcast belongs to. Stamped at creation time. */
  cityId?: string;
  /** True once the user has opened this podcast in the player. */
  played?: boolean;
}

interface PodcastContextValue {
  /** Podcasts for the currently focused city. */
  podcasts: Podcast[];
  /** Podcasts grouped by cityId, for multi-city Library/Podcasts views. */
  podcastsByCity: Record<string, Podcast[]>;
  isLoading: boolean;
  addPodcast: (podcast: Podcast) => Promise<void>;
  updatePodcast: (id: string, updates: Partial<Podcast>) => Promise<void>;
  removePodcast: (id: string) => Promise<void>;
  clearAllPodcasts: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
}

function getStorageKey(cityId: string): string {
  return `${cityId}_stories_podcasts`;
}

const PodcastContext = createContext<PodcastContextValue | null>(null);

export function PodcastProvider({ children }: { children: ReactNode }) {
  const [podcastsByCity, setPodcastsByCity] = useState<Record<string, Podcast[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { token, isAuthenticated } = useAuth();
  const { activeCityIds, currentCityId, isLoaded: cityLoaded } = useCityConfig();
  const serverLoadedSet = useRef<Set<string>>(new Set());

  const savePodcasts = useCallback(async (cityId: string, list: Podcast[]) => {
    try {
      await AsyncStorage.setItem(getStorageKey(cityId), JSON.stringify(list));
    } catch (e) {
      console.error("Failed to save podcasts:", e);
    }
  }, []);

  const loadFromServerForCity = useCallback(
    async (cityId: string) => {
      if (!token || !isAuthenticated) return;
      try {
        const res = await apiRequest("GET", "/api/podcast/history", undefined, { cityId });
        const data = await res.json();
        if (data.podcasts && Array.isArray(data.podcasts)) {
          // Trust server-returned cityId if present (defensive: handles legacy
          // rows or edge cases where a podcast lives in a city different from
          // the request). Falls back to the requested cityId.
          const serverPodcasts: Podcast[] = data.podcasts.map((p: any) => ({
            id: p.id,
            title: p.title || "",
            titleNl: p.titleNl || p.title || "",
            subject: p.subject || undefined,
            theme: p.theme || "",
            themeNl: p.themeNl || p.theme || "",
            script: p.script || "",
            audioUrl: p.audioUrl || "",
            language: p.language || "en",
            voice: p.voice || "female",
            perspective: p.perspective || "",
            length: p.length || "short",
            durationSeconds: p.durationSeconds || 0,
            status: "ready" as const,
            createdAt: p.createdAt || new Date().toISOString(),
            isCustom: p.isCustom || false,
            customDbId: p.customDbId || undefined,
            cityId: typeof p.cityId === "string" && p.cityId.length > 0 ? p.cityId : cityId,
          }));

          // Group server podcasts by their actual cityId — server should only
          // return podcasts for the requested city, but if a stray podcast
          // comes through with a different cityId, we route it to its real
          // bucket instead of forcing it into the requested one.
          const groupedByCity: Record<string, Podcast[]> = {};
          for (const p of serverPodcasts) {
            const cid = p.cityId ?? cityId;
            (groupedByCity[cid] ??= []).push(p);
          }

          setPodcastsByCity((prev) => {
            const next: Record<string, Podcast[]> = { ...prev };
            // For the requested city, merge in-progress with server data.
            const prevForRequested = prev[cityId] ?? [];
            const inProgress = prevForRequested.filter((p) => p.status === "generating");
            const serverForRequested = groupedByCity[cityId] ?? [];
            const serverIdsForRequested = new Set(serverForRequested.map((p) => p.id));
            const filteredInProgress = inProgress.filter((p) => !serverIdsForRequested.has(p.id));
            next[cityId] = [...filteredInProgress, ...serverForRequested];
            savePodcasts(cityId, next[cityId]);

            // For any OTHER city that came back in this response, append
            // (don't overwrite — we don't have the full picture).
            for (const [cid, list] of Object.entries(groupedByCity)) {
              if (cid === cityId) continue;
              const existing = next[cid] ?? [];
              const existingIds = new Set(existing.map((p) => p.id));
              const additions = list.filter((p) => !existingIds.has(p.id));
              if (additions.length > 0) {
                next[cid] = [...existing, ...additions];
                savePodcasts(cid, next[cid]);
              }
            }

            return next;
          });
        }
      } catch (e) {
        console.error(`Failed to load podcast history from server for ${cityId}:`, e);
      }
    },
    [token, isAuthenticated, savePodcasts],
  );

  // Load local storage for all active cities once cityConfig is ready
  useEffect(() => {
    if (!cityLoaded) return;
    let cancelled = false;
    (async () => {
      const buckets: Record<string, Podcast[]> = {};
      await Promise.all(
        activeCityIds.map(async (cityId) => {
          try {
            const stored = await AsyncStorage.getItem(getStorageKey(cityId));
            if (!stored) {
              buckets[cityId] = [];
              return;
            }
            const parsed: Podcast[] = JSON.parse(stored);
            const migrated = parsed.map((p) => {
              const stamped = p.cityId ? p : { ...p, cityId };
              if (stamped.audioUrl && (stamped.audioUrl.startsWith("http://") || stamped.audioUrl.startsWith("https://"))) {
                try {
                  const url = new URL(stamped.audioUrl);
                  return { ...stamped, audioUrl: url.pathname };
                } catch {
                  return stamped;
                }
              }
              return stamped;
            });
            buckets[cityId] = migrated;
            if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
              savePodcasts(cityId, migrated);
            }
          } catch (e) {
            console.error(`Failed to load local podcasts for ${cityId}:`, e);
            buckets[cityId] = [];
          }
        }),
      );
      if (cancelled) return;
      setPodcastsByCity(buckets);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [cityLoaded, activeCityIds, savePodcasts]);

  // Load server data for each active city once authenticated
  useEffect(() => {
    if (!isAuthenticated || !token || isLoading) return;
    activeCityIds.forEach((cityId) => {
      if (!serverLoadedSet.current.has(cityId)) {
        serverLoadedSet.current.add(cityId);
        loadFromServerForCity(cityId);
      }
    });
  }, [isAuthenticated, token, isLoading, activeCityIds, loadFromServerForCity]);

  // Reset server-loaded markers on logout so re-login re-fetches
  useEffect(() => {
    if (!isAuthenticated) {
      serverLoadedSet.current.clear();
    }
  }, [isAuthenticated]);

  const refreshFromServer = useCallback(async () => {
    await Promise.all(activeCityIds.map((cityId) => loadFromServerForCity(cityId)));
  }, [activeCityIds, loadFromServerForCity]);

  const addPodcast = useCallback(
    async (podcast: Podcast) => {
      const cityId = podcast.cityId || currentCityId;
      const stamped: Podcast = { ...podcast, cityId };
      setPodcastsByCity((prev) => {
        const prevForCity = prev[cityId] ?? [];
        const updated = [stamped, ...prevForCity];
        savePodcasts(cityId, updated);
        return { ...prev, [cityId]: updated };
      });

      try {
        const countStr = await AsyncStorage.getItem("createdPodcastCount");
        const count = (parseInt(countStr || "0", 10) || 0) + 1;
        await AsyncStorage.setItem("createdPodcastCount", String(count));

        if (count === 5) {
          const isAvailable = await StoreReview.isAvailableAsync();
          if (isAvailable) {
            await StoreReview.requestReview();
          }
        }
      } catch {}
    },
    [currentCityId, savePodcasts],
  );

  const updatePodcast = useCallback(
    async (id: string, updates: Partial<Podcast>) => {
      setPodcastsByCity((prev) => {
        const next: Record<string, Podcast[]> = {};
        for (const [cityId, list] of Object.entries(prev)) {
          const updated = list.map((p) => (p.id === id ? { ...p, ...updates } : p));
          next[cityId] = updated;
          if (updated.some((p) => p.id === id)) {
            savePodcasts(cityId, updated);
          }
        }
        return next;
      });
    },
    [savePodcasts],
  );

  const removePodcast = useCallback(
    async (id: string) => {
      setPodcastsByCity((prev) => {
        const next: Record<string, Podcast[]> = {};
        for (const [cityId, list] of Object.entries(prev)) {
          const updated = list.filter((p) => p.id !== id);
          next[cityId] = updated;
          if (list.length !== updated.length) {
            savePodcasts(cityId, updated);
          }
        }
        return next;
      });
    },
    [savePodcasts],
  );

  const clearAllPodcasts = useCallback(async () => {
    await Promise.all(
      Object.keys(podcastsByCity).map((cityId) => savePodcasts(cityId, [])),
    );
    setPodcastsByCity({});
  }, [podcastsByCity, savePodcasts]);

  const podcasts = useMemo(() => podcastsByCity[currentCityId] ?? [], [podcastsByCity, currentCityId]);

  const value = useMemo(
    () => ({
      podcasts,
      podcastsByCity,
      isLoading,
      addPodcast,
      updatePodcast,
      removePodcast,
      clearAllPodcasts,
      refreshFromServer,
    }),
    [podcasts, podcastsByCity, isLoading, addPodcast, updatePodcast, removePodcast, clearAllPodcasts, refreshFromServer],
  );

  return <PodcastContext.Provider value={value}>{children}</PodcastContext.Provider>;
}

export function usePodcasts() {
  const context = useContext(PodcastContext);
  if (!context) {
    throw new Error("usePodcasts must be used within a PodcastProvider");
  }
  return context;
}
