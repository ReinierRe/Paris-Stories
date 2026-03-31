import React, { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect, ReactNode } from "react";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid, AVPlaybackStatus } from "expo-av";
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { resolveAudioUrl, Podcast } from "@/contexts/PodcastContext";

interface AudioPlayerState {
  currentPodcast: Podcast | null;
  isPlaying: boolean;
  isLoading: boolean;
  audioError: boolean;
  position: number;
  duration: number;
}

interface AudioPlayerContextValue extends AudioPlayerState {
  loadAndPlay: (podcast: Podcast) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekForward: () => Promise<void>;
  seekBackward: () => Promise<void>;
  seekTo: (positionMillis: number) => Promise<void>;
  stop: () => Promise<void>;
  retry: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentPodcastRef = useRef<Podcast | null>(null);
  const loadTokenRef = useRef(0);
  const [state, setState] = useState<AudioPlayerState>({
    currentPodcast: null,
    isPlaying: false,
    isLoading: false,
    audioError: false,
    position: 0,
    duration: 0,
  });

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setState((prev) => ({
        ...prev,
        position: status.positionMillis || 0,
        duration: status.durationMillis || 0,
        isPlaying: status.isPlaying || false,
      }));

      if (status.didJustFinish) {
        if (soundRef.current) {
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        currentPodcastRef.current = null;
        loadTokenRef.current += 1;
        setState({
          currentPodcast: null,
          isPlaying: false,
          isLoading: false,
          audioError: false,
          position: 0,
          duration: 0,
        });

        (async () => {
          try {
            const countStr = await AsyncStorage.getItem("completedPodcastCount");
            const count = (parseInt(countStr || "0", 10) || 0) + 1;
            await AsyncStorage.setItem("completedPodcastCount", String(count));

            if (count === 1 || count === 10) {
              const isAvailable = await StoreReview.isAvailableAsync();
              if (isAvailable) {
                await StoreReview.requestReview();
              }
            }
          } catch {}
        })();
      }
    } else if (status.error) {
      console.error("Playback error:", status.error);
      setState((prev) => ({ ...prev, audioError: true, isPlaying: false }));
    }
  }, []);

  const unloadCurrent = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const loadAndPlay = useCallback(async (podcast: Podcast) => {
    if (currentPodcastRef.current?.id === podcast.id && soundRef.current) {
      try {
        await soundRef.current.playAsync();
      } catch (e) {
        console.error("Failed to resume playback:", e);
        setState((prev) => ({ ...prev, audioError: true }));
      }
      return;
    }

    loadTokenRef.current += 1;
    const thisToken = loadTokenRef.current;

    await unloadCurrent();
    currentPodcastRef.current = podcast;

    setState({
      currentPodcast: podcast,
      isPlaying: false,
      isLoading: true,
      audioError: false,
      position: 0,
      duration: 0,
    });

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      const fullAudioUrl = resolveAudioUrl(podcast.audioUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: fullAudioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate,
      );

      if (thisToken !== loadTokenRef.current) {
        try { await sound.unloadAsync(); } catch {}
        return;
      }

      soundRef.current = sound;
      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      if (thisToken !== loadTokenRef.current) return;
      console.error("Failed to load audio:", error);
      setState((prev) => ({ ...prev, isLoading: false, audioError: true }));
    }
  }, [unloadCurrent, onPlaybackStatusUpdate]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (e) {
      console.error("Toggle play error:", e);
    }
  }, []);

  const seekForward = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        const newPos = Math.min((status.positionMillis || 0) + 15000, status.durationMillis || 0);
        await soundRef.current.setPositionAsync(newPos);
      }
    } catch (e) {
      console.error("Seek forward error:", e);
    }
  }, []);

  const seekBackward = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded) {
        const newPos = Math.max((status.positionMillis || 0) - 15000, 0);
        await soundRef.current.setPositionAsync(newPos);
      }
    } catch (e) {
      console.error("Seek backward error:", e);
    }
  }, []);

  const seekTo = useCallback(async (positionMillis: number) => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.setPositionAsync(positionMillis);
    } catch (e) {
      console.error("Seek error:", e);
    }
  }, []);

  const stop = useCallback(async () => {
    loadTokenRef.current += 1;
    await unloadCurrent();
    currentPodcastRef.current = null;
    setState({
      currentPodcast: null,
      isPlaying: false,
      isLoading: false,
      audioError: false,
      position: 0,
      duration: 0,
    });
  }, [unloadCurrent]);

  const retry = useCallback(async () => {
    if (!currentPodcastRef.current) return;
    const podcast = currentPodcastRef.current;
    currentPodcastRef.current = null;
    await unloadCurrent();
    await loadAndPlay(podcast);
  }, [loadAndPlay, unloadCurrent]);

  const value = useMemo(() => ({
    ...state,
    loadAndPlay,
    togglePlay,
    seekForward,
    seekBackward,
    seekTo,
    stop,
    retry,
  }), [state, loadAndPlay, togglePlay, seekForward, seekBackward, seekTo, stop, retry]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
}
