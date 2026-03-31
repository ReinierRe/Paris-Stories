import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

export default function MiniPlayer() {
  const { currentPodcast, isPlaying, isLoading, position, duration, togglePlay, stop } = useAudioPlayer();

  if (!currentPodcast) return null;

  const progress = duration > 0 ? position / duration : 0;
  const displayTitle = currentPodcast.language === "nl"
    ? currentPodcast.titleNl || currentPodcast.title
    : currentPodcast.title;

  const handlePress = () => {
    router.push({ pathname: "/player", params: { podcastId: currentPodcast.id } });
  };

  const handleTogglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await togglePlay();
  };

  const handleClose = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await stop();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Pressable style={styles.container} onPress={handlePress}>
        <View style={styles.iconContainer}>
          <Ionicons name="headset" size={20} color={Colors.light.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>{displayTitle}</Text>
          <Text style={styles.theme} numberOfLines={1}>{currentPodcast.theme}</Text>
        </View>
        <View style={styles.controls}>
          <Pressable onPress={handleTogglePlay} hitSlop={8} style={styles.controlButton}>
            {isLoading ? (
              <Ionicons name="hourglass-outline" size={22} color={Colors.light.text} />
            ) : (
              <Ionicons name={isPlaying ? "pause" : "play"} size={22} color={Colors.light.text} />
            )}
          </Pressable>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.controlButton}>
            <Ionicons name="close" size={20} color={Colors.light.textSecondary} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.cardBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.light.divider,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.accent,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(196, 162, 101, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
  },
  theme: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
