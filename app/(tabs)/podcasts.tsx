import React, { useCallback, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "@/constants/colors";
import { usePodcasts, type Podcast } from "@/contexts/PodcastContext";
import { apiRequest } from "@/lib/query-client";

const DELETE_THRESHOLD = -80;
const SNAP_OPEN = -88;
const SCREEN_WIDTH = Dimensions.get("window").width;

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function SwipeablePodcastCard({
  podcast,
  onDelete,
}: {
  podcast: Podcast;
  onDelete: (id: string) => void;
}) {
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const handlePress = () => {
    if (podcast.status === "ready") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: "/player", params: { podcastId: podcast.id } });
    }
  };

  const triggerDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Podcast",
      `Are you sure you want to delete "${podcast.title}"?`,
      [
        { text: "Cancel", style: "cancel", onPress: () => { translateX.value = withSpring(0, { damping: 20 }); isOpen.value = false; } },
        { text: "Delete", style: "destructive", onPress: () => { onDelete(podcast.id); } },
      ]
    );
  }, [podcast.id, podcast.title, onDelete]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      const base = isOpen.value ? SNAP_OPEN : 0;
      const newX = base + e.translationX;
      translateX.value = Math.min(0, Math.max(newX, -SCREEN_WIDTH * 0.4));
    })
    .onEnd((e) => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withSpring(SNAP_OPEN, { damping: 20 });
        isOpen.value = true;
      } else {
        translateX.value = withSpring(0, { damping: 20 });
        isOpen.value = false;
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (isOpen.value) {
      translateX.value = withSpring(0, { damping: 20 });
      isOpen.value = false;
    } else {
      runOnJS(handlePress)();
    }
  });

  const composed = Gesture.Race(panGesture, tapGesture);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteStyle = useAnimatedStyle(() => {
    const width = interpolate(
      translateX.value,
      [0, SNAP_OPEN],
      [0, Math.abs(SNAP_OPEN)],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD / 2, DELETE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    );
    return { width, opacity };
  });

  const iconScale = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ scale }] };
  });

  const getStatusIcon = () => {
    switch (podcast.status) {
      case "generating":
        return <ActivityIndicator size="small" color={Colors.light.generating} />;
      case "ready":
        return (
          <View style={styles.playButton}>
            <Ionicons name="play" size={16} color="#FFFFFF" />
          </View>
        );
      case "error":
        return <Ionicons name="alert-circle" size={24} color={Colors.light.error} />;
    }
  };

  const languageFlag = podcast.language === "nl" ? "NL" : "EN";
  const voiceLabel = podcast.voice === "male" ? "Male" : "Female";
  const duration = formatDuration(podcast.durationSeconds);

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={[styles.deleteAction, deleteStyle]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => triggerDelete()}
          activeOpacity={0.7}
        >
          <Animated.View style={iconScale}>
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.podcastCard, cardStyle]}>
          <View style={styles.podcastCardContent}>
            <View style={styles.podcastInfo}>
              <Text style={[styles.podcastTheme, podcast.isCustom && styles.podcastThemeCustom]}>{podcast.isCustom ? "Custom" : podcast.theme}</Text>
              <Text style={styles.podcastTitle} numberOfLines={2}>
                {podcast.title}
              </Text>
              <View style={styles.podcastMeta}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{languageFlag}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Ionicons
                    name={podcast.voice === "male" ? "man" : "woman"}
                    size={11}
                    color={Colors.light.textSecondary}
                  />
                  <Text style={styles.metaBadgeText}>{voiceLabel}</Text>
                </View>
                {duration ? (
                  <View style={styles.metaBadge}>
                    <Ionicons name="time-outline" size={11} color={Colors.light.textSecondary} />
                    <Text style={styles.metaBadgeText}>{duration}</Text>
                  </View>
                ) : null}
                <Text style={styles.podcastStatus}>
                  {podcast.status === "generating"
                    ? "Generating..."
                    : podcast.status === "error"
                      ? "Failed"
                      : podcast.language === "nl"
                        ? "Nederlands"
                        : "English"}
                </Text>
              </View>
            </View>
            <View style={styles.statusContainer}>{getStatusIcon()}</View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="headset-outline" size={48} color={Colors.light.textTertiary} />
      <Text style={styles.emptyTitle}>No podcasts yet</Text>
      <Text style={styles.emptyDescription}>
        Browse the library and create your first personalized Paris podcast
      </Text>
    </View>
  );
}

export default function PodcastsScreen() {
  const { podcasts, isLoading, removePodcast } = usePodcasts();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const handleDelete = useCallback(async (id: string) => {
    const podcast = podcasts.find((p) => p.id === id);
    if (podcast?.isCustom && podcast?.customDbId) {
      try {
        await apiRequest("DELETE", `/api/podcast/custom/${podcast.customDbId}`);
      } catch (e) {
        console.error("Failed to delete custom podcast from server:", e);
      }
    }
    await removePodcast(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [removePodcast, podcasts]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlatList
        data={podcasts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeablePodcastCard podcast={item} onDelete={handleDelete} />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 16 + webTopInset },
          podcasts.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          podcasts.length > 0 ? (
            <View style={styles.headerSection}>
              <Text style={styles.headerTitle}>My Podcasts</Text>
              <Text style={styles.headerSubtitle}>
                {podcasts.filter((p) => p.status === "ready").length} ready
                {podcasts.some((p) => p.status === "generating") &&
                  ` | ${podcasts.filter((p) => p.status === "generating").length} generating`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState />}
        scrollEnabled={podcasts.length > 0}
      />
    </GestureHandlerRootView>
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
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  headerSection: {
    marginBottom: 24,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  swipeContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  deleteAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#E74C3C",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  deleteButton: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  podcastCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  podcastCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  podcastInfo: {
    flex: 1,
  },
  podcastTheme: {
    fontSize: 11,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  podcastThemeCustom: {
    color: "#8E44AD",
  },
  podcastTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
    lineHeight: 22,
  },
  podcastMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.overlay,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 11,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  podcastStatus: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
  },
  statusContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
    marginTop: 4,
  },
  emptyDescription: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
