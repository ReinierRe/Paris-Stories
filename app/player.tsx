import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import * as StoreReview from "expo-store-review";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePodcasts, resolveAudioUrl } from "@/contexts/PodcastContext";

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
  const [audioError, setAudioError] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showScript, setShowScript] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const progressBarWidth = useRef(0);

  useEffect(() => {
    if (podcast?.audioUrl) {
      loadAudio();
    } else if (podcast) {
      setIsLoading(false);
      setAudioError(true);
    }
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [podcast?.audioUrl]);

  const loadAudio = async () => {
    setAudioError(false);
    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });

      const fullAudioUrl = resolveAudioUrl(podcast!.audioUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: fullAudioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate,
      );
      soundRef.current = sound;
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to load audio:", error);
      setIsLoading(false);
      setAudioError(true);
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
      setAudioError(true);
      setIsPlaying(false);
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

  const displayPosition = isSeeking ? seekPosition : position;
  const progress = duration > 0 ? displayPosition / duration : 0;

  const onProgressBarLayout = (e: LayoutChangeEvent) => {
    progressBarWidth.current = e.nativeEvent.layout.width;
  };

  const seekToPosition = async (pageX: number, barRef: View | null) => {
    if (!soundRef.current || duration <= 0 || !barRef) return;
    barRef.measure((_x, _y, width, _height, pageXOffset) => {
      const relativeX = Math.max(0, Math.min(pageX - pageXOffset, width));
      const ratio = relativeX / width;
      const newPos = Math.floor(ratio * duration);
      setSeekPosition(newPos);
      soundRef.current?.setPositionAsync(newPos);
    });
  };

  const progressBarRef = useRef<View>(null);

  const handleProgressTouchStart = (e: GestureResponderEvent) => {
    setIsSeeking(true);
    seekToPosition(e.nativeEvent.pageX, progressBarRef.current);
  };

  const handleProgressTouchMove = (e: GestureResponderEvent) => {
    seekToPosition(e.nativeEvent.pageX, progressBarRef.current);
  };

  const handleProgressTouchEnd = () => {
    setIsSeeking(false);
  };

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
          {audioError ? (
            <View style={styles.errorCard}>
              <View style={styles.errorIconCircle}>
                <Ionicons name="cloud-offline-outline" size={40} color={Colors.light.accent} />
              </View>
              <Text style={styles.errorTitle}>Audio unavailable</Text>
              <Text style={styles.errorDescription}>
                The audio file for this podcast could not be loaded. You can still read the script using the button above.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.8 }]}
                onPress={loadAudio}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.artwork}>
              <View style={styles.artworkInner}>
                <Ionicons name="headset" size={64} color={Colors.light.accent} />
              </View>
            </View>
          )}

          <View style={styles.podcastMeta}>
            <Text style={styles.podcastThemeLabel}>{podcast.theme}</Text>
            <Text style={styles.podcastTitleLabel} numberOfLines={2}>
              {podcast.language === "nl" ? podcast.titleNl || podcast.title : podcast.title}
            </Text>
            {podcast.isCustom && podcast.subject && podcast.subject !== podcast.title && (
              <Text style={styles.podcastSubjectLabel} numberOfLines={2}>
                {podcast.subject}
              </Text>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {podcast.language === "nl" ? "Nederlands" : podcast.language === "fr" ? "Français" : podcast.language === "de" ? "Deutsch" : podcast.language === "es" ? "Español" : "English"}
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
          <View
            ref={progressBarRef}
            style={styles.progressTouchArea}
            onLayout={onProgressBarLayout}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={handleProgressTouchStart}
            onResponderMove={handleProgressTouchMove}
            onResponderRelease={handleProgressTouchEnd}
            onResponderTerminate={handleProgressTouchEnd}
          >
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(displayPosition)}</Text>
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
  errorCard: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(196, 162, 101, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
  },
  errorDescription: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: "#FFFFFF",
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
  podcastSubjectLabel: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
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
  progressTouchArea: {
    paddingVertical: 12,
    justifyContent: "center",
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.light.divider,
    borderRadius: 2,
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.accent,
    borderRadius: 2,
  },
  progressThumb: {
    position: "absolute",
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.light.accent,
    marginLeft: -7,
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
