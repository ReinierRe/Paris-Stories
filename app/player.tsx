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
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePodcasts } from "@/contexts/PodcastContext";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useTranslation } from "@/i18n/useTranslation";

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
  const { t } = useTranslation();
  const {
    currentPodcast,
    isPlaying,
    isLoading,
    audioError,
    position,
    duration,
    loadAndPlay,
    togglePlay,
    seekForward,
    seekBackward,
    seekTo,
    retry,
  } = useAudioPlayer();

  const podcast = podcasts.find((p) => p.id === podcastId);

  const [showScript, setShowScript] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const progressBarWidth = useRef(0);
  const progressBarRef = useRef<View>(null);

  useEffect(() => {
    if (podcast?.audioUrl && currentPodcast?.id !== podcast.id) {
      loadAndPlay(podcast);
    }
  }, [podcast?.id]);

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlay();
  };

  if (!podcast) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t("player.podcastNotFound")}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLinkText}>{t("player.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  if (!podcast.audioUrl) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{t("player.audioUnavailable")}</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLinkText}>{t("player.goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  const isCurrentPodcast = currentPodcast?.id === podcast.id;
  const displayPosition = isSeeking ? seekPosition : (isCurrentPodcast ? position : 0);
  const displayDuration = isCurrentPodcast ? duration : 0;
  const progress = displayDuration > 0 ? displayPosition / displayDuration : 0;
  const currentIsPlaying = isCurrentPodcast ? isPlaying : false;
  const currentIsLoading = isCurrentPodcast ? isLoading : (!isCurrentPodcast && podcast.audioUrl ? true : false);
  const currentAudioError = isCurrentPodcast ? audioError : false;

  const onProgressBarLayout = (e: LayoutChangeEvent) => {
    progressBarWidth.current = e.nativeEvent.layout.width;
  };

  const seekToPosition = async (pageX: number, barRef: View | null) => {
    if (displayDuration <= 0 || !barRef) return;
    barRef.measure((_x, _y, width, _height, pageXOffset) => {
      const relativeX = Math.max(0, Math.min(pageX - pageXOffset, width));
      const ratio = relativeX / width;
      const newPos = Math.floor(ratio * displayDuration);
      setSeekPosition(newPos);
      seekTo(newPos);
    });
  };

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

  const langKey = `languages.${podcast.language}` as const;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 + webTopInset }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>{t("player.nowPlaying")}</Text>
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
          {currentAudioError ? (
            <View style={styles.errorCard}>
              <View style={styles.errorIconCircle}>
                <Ionicons name="cloud-offline-outline" size={40} color={Colors.light.accent} />
              </View>
              <Text style={styles.errorTitle}>{t("player.audioUnavailable")}</Text>
              <Text style={styles.errorDescription}>
                {t("player.audioErrorMessage")}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.8 }]}
                onPress={retry}
              >
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>{t("player.tryAgain")}</Text>
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
                {t(langKey)}
              </Text>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>
                {podcast.voice === "female" ? t("player.femaleVoice") : t("player.maleVoice")}
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
            <Text style={styles.timeText}>{formatTime(displayDuration)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={seekBackward} style={styles.seekButton} hitSlop={8}>
            <Ionicons name="play-back" size={28} color={Colors.light.text} />
            <Text style={styles.seekLabel}>15</Text>
          </Pressable>

          <Pressable
            onPress={handleTogglePlay}
            style={({ pressed }) => [
              styles.playPauseButton,
              pressed && styles.playPausePressed,
            ]}
            disabled={currentIsLoading}
          >
            {currentIsLoading ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={currentIsPlaying ? "pause" : "play"}
                size={36}
                color="#FFFFFF"
                style={!currentIsPlaying ? { marginLeft: 4 } : undefined}
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
