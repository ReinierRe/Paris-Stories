import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { usePodcasts, type Podcast } from "@/contexts/PodcastContext";

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function PodcastCard({ podcast }: { podcast: Podcast }) {
  const handlePress = () => {
    if (podcast.status === "ready") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({ pathname: "/player", params: { podcastId: podcast.id } });
    }
  };

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
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={podcast.status === "generating"}
      style={styles.podcastCard}
    >
      <View style={styles.podcastCardContent}>
        <View style={styles.podcastInfo}>
          <Text style={styles.podcastTheme}>{podcast.theme}</Text>
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
    </TouchableOpacity>
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
  const { podcasts, isLoading } = usePodcasts();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={podcasts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PodcastCard podcast={item} />}
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
  podcastCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    marginBottom: 12,
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
