import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Podcast {
  id: string;
  title: string;
  titleNl: string;
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
}

const STORAGE_KEY = "paris_stories_podcasts";

const PodcastContext = createContext<PodcastContextValue | null>(null);

export function PodcastProvider({ children }: { children: ReactNode }) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      const shouldClear = await AsyncStorage.getItem("paris_stories_clear_once");
      if (!shouldClear) {
        await AsyncStorage.setItem("paris_stories_clear_once", "done");
        await AsyncStorage.removeItem(STORAGE_KEY);
        setIsLoading(false);
        return;
      }
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPodcasts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load podcasts:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const savePodcasts = async (newPodcasts: Podcast[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPodcasts));
    } catch (e) {
      console.error("Failed to save podcasts:", e);
    }
  };

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
    () => ({ podcasts, isLoading, addPodcast, updatePodcast, removePodcast, clearAllPodcasts }),
    [podcasts, isLoading, addPodcast, updatePodcast, removePodcast, clearAllPodcasts],
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
