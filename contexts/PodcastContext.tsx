import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, getApiUrl } from "@/lib/query-client";

export function resolveAudioUrl(audioUrl: string): string {
  if (!audioUrl) return "";
  if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
    try {
      const url = new URL(audioUrl);
      return new URL(url.pathname, getApiUrl()).toString();
    } catch {
      return audioUrl;
    }
  }
  return new URL(audioUrl, getApiUrl()).toString();
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
  language: "en" | "nl";
  voice: "male" | "female";
  perspective: string;
  length: string;
  durationSeconds?: number;
  status: "generating" | "ready" | "error";
  createdAt: string;
  errorMessage?: string;
  isCustom?: boolean;
  customDbId?: string;
}

interface PodcastContextValue {
  podcasts: Podcast[];
  isLoading: boolean;
  addPodcast: (podcast: Podcast) => Promise<void>;
  updatePodcast: (id: string, updates: Partial<Podcast>) => Promise<void>;
  removePodcast: (id: string) => Promise<void>;
  clearAllPodcasts: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
}

const STORAGE_KEY = "paris_stories_podcasts";

const PodcastContext = createContext<PodcastContextValue | null>(null);

export function PodcastProvider({ children }: { children: ReactNode }) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverLoaded, setServerLoaded] = useState(false);
  const { token, isAuthenticated } = useAuth();

  const savePodcasts = async (newPodcasts: Podcast[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPodcasts));
    } catch (e) {
      console.error("Failed to save podcasts:", e);
    }
  };

  const loadFromServer = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    try {
      const res = await apiRequest("GET", "/api/podcast/history");
      const data = await res.json();
      if (data.podcasts && Array.isArray(data.podcasts)) {
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
        }));

        setPodcasts((prev) => {
          const inProgress = prev.filter((p) => p.status === "generating");
          const serverIds = new Set(serverPodcasts.map((p) => p.id));
          const filteredInProgress = inProgress.filter((p) => !serverIds.has(p.id));
          const merged = [...filteredInProgress, ...serverPodcasts];
          savePodcasts(merged);
          return merged;
        });
      }
    } catch (e) {
      console.error("Failed to load podcast history from server:", e);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    const loadLocal = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Podcast[] = JSON.parse(stored);
          const migrated = parsed.map((p) => {
            if (p.audioUrl && (p.audioUrl.startsWith("http://") || p.audioUrl.startsWith("https://"))) {
              try {
                const url = new URL(p.audioUrl);
                return { ...p, audioUrl: url.pathname };
              } catch {
                return p;
              }
            }
            return p;
          });
          setPodcasts(migrated);
          if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
            savePodcasts(migrated);
          }
        }
      } catch (e) {
        console.error("Failed to load podcasts:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadLocal();
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && !isLoading && !serverLoaded) {
      setServerLoaded(true);
      loadFromServer();
    }
    if (!isAuthenticated) {
      setServerLoaded(false);
    }
  }, [isAuthenticated, token, isLoading, serverLoaded, loadFromServer]);

  const refreshFromServer = useCallback(async () => {
    await loadFromServer();
  }, [loadFromServer]);

  const addPodcast = useCallback(async (podcast: Podcast) => {
    setPodcasts((prev) => {
      const updated = [podcast, ...prev];
      savePodcasts(updated);
      return updated;
    });
  }, []);

  const updatePodcast = useCallback(async (id: string, updates: Partial<Podcast>) => {
    setPodcasts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      savePodcasts(updated);
      return updated;
    });
  }, []);

  const removePodcast = useCallback(async (id: string) => {
    setPodcasts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      savePodcasts(updated);
      return updated;
    });
  }, []);

  const clearAllPodcasts = useCallback(async () => {
    setPodcasts([]);
    await savePodcasts([]);
  }, []);

  const value = useMemo(
    () => ({ podcasts, isLoading, addPodcast, updatePodcast, removePodcast, clearAllPodcasts, refreshFromServer }),
    [podcasts, isLoading, addPodcast, updatePodcast, removePodcast, clearAllPodcasts, refreshFromServer],
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
