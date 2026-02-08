import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePodcasts } from "@/contexts/PodcastContext";

function formatTime(millis: number): string {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function PlayerScreen() {
  const { podcastId } = useLocalSearchParams<{ podcastId: string }>();
  const { podcasts } = usePodcasts();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const podcast = podcasts.find((p) => p.id === podcastId);

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showScript, setShowScript] = useState(false);

  useEffect(() => {
    if (podcast?.audioUrl) {
      loadAudio();
    }
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [podcast?.audioUrl]);

  const loadAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: podcast!.audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate,
      );
      soundRef.current = sound;
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load audio:", error);
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying || false);

      if (status.didJustFinish) {
        setIsPlaying(false);
        soundRef.current?.setPositionAsync(0);
      }
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const seekForward = async () => {
    if (!soundRef.current) return;
    const newPos = Math.min(position + 15000, duration);
    await soundRef.current.setPositionAsync(newPos);
  };

  const seekBackward = async () => {
    if (!soundRef.current) return;
    const newPos = Math.max(position - 15000, 0);
    await soundRef.current.setPositionAsync(newPos);
  };

  if (!podcast) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Podcast not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 + webTopInset }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>Now Playing</Text>
        <Pressable
          onPress={() => setShowScript(!showScript)}
          hitSlop={12}
        >
          <Ionicons
            name={showScript ? "document-text" : "document-text-outline"}
            size={22}
            color={Colors.light.text}
          />
        </Pressable>
      </View>

      {showScript ? (
        <ScrollView
          style={styles.scriptScrollView}
          contentContainerStyle={[styles.scriptContent, { paddingBottom: 300 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.scriptText}>{podcast.script}</Text>
        </ScrollView>
      ) : (
        <View style={styles.artworkContainer}>
          <View style={styles.artwork}>
            <View style={styles.artworkInner}>
              <Ionicons name="headset" size={64} color={Colors.light.accent} />
            </View>
          </View>

          <View style={styles.podcastMeta}>
            <Text style={styles.podcastThemeLabel}>{podcast.theme}</Text>
            <Text style={styles.podcastTitleLabel} numberOfLines={2}>
              {podcast.language === "nl" ? podcast.titleNl || podcast.title : podcast.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {podcast.language === "nl" ? "Nederlands" : "English"}
              </Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>
                {podcast.voice === "female" ? "Female" : "Male"} voice
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 24 + (Platform.OS === "web" ? 34 : 0) }]}>
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={seekBackward} style={styles.seekButton} hitSlop={8}>
            <Ionicons name="play-back" size={28} color={Colors.light.text} />
            <Text style={styles.seekLabel}>15</Text>
          </Pressable>

          <Pressable
            onPress={togglePlay}
            style={({ pressed }) => [
              styles.playPauseButton,
              pressed && styles.playPausePressed,
            ]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={36}
                color="#FFFFFF"
                style={!isPlaying ? { marginLeft: 4 } : undefined}
              />
            )}
          </Pressable>

          <Pressable onPress={seekForward} style={styles.seekButton} hitSlop={8}>
            <Ionicons name="play-forward" size={28} color={Colors.light.text} />
            <Text style={styles.seekLabel}>15</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  backLinkText: {
    fontSize: 15,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topBarTitle: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  artworkContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  artwork: {
    width: 220,
    height: 220,
    borderRadius: 28,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  artworkInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(196, 162, 101, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  podcastMeta: {
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 20,
  },
  podcastThemeLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  podcastTitleLabel: {
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
    textAlign: "center",
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.light.textTertiary,
  },
  scriptScrollView: {
    flex: 1,
  },
  scriptContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  scriptText: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.text,
    lineHeight: 26,
  },
  controlsContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: Colors.light.background,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.divider,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.accent,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textTertiary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
  },
  seekButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  seekLabel: {
    fontSize: 10,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  playPausePressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
});
