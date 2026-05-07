import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "@/constants/colors";
import { usePodcasts, type Podcast } from "@/contexts/PodcastContext";
import { apiRequest } from "@/lib/query-client";
import { useTranslation } from "@/i18n/useTranslation";
import { useCityConfig } from "@/contexts/CityConfigContext";
import { getCityConfigSync, getLocalizedCityName } from "@/constants/city";
import { flagEmoji, getRegistryEntry } from "@/constants/cityRegistry";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  t,
}: {
  podcast: Podcast;
  onDelete: (id: string) => void;
  t: (key: string, options?: Record<string, any>) => string;
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
      t("podcasts.deleteTitle"),
      t("podcasts.deleteMessage", { title: podcast.title }),
      [
        { text: t("common.cancel"), style: "cancel", onPress: () => { translateX.value = withSpring(0, { damping: 20 }); isOpen.value = false; } },
        { text: t("common.delete"), style: "destructive", onPress: () => { onDelete(podcast.id); } },
      ]
    );
  }, [podcast.id, podcast.title, onDelete, t]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((e) => {
      const base = isOpen.value ? SNAP_OPEN : 0;
      const newX = base + e.translationX;
      translateX.value = Math.min(0, Math.max(newX, -SCREEN_WIDTH * 0.4));
    })
    .onEnd(() => {
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

  const languageFlag = podcast.language.toUpperCase();
  const voiceLabel = podcast.voice === "male" ? t("podcasts.maleVoice") : t("podcasts.femaleVoice");
  const duration = formatDuration(podcast.durationSeconds);
  const langKey = `languages.${podcast.language}` as const;

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
              <Text style={[styles.podcastTheme, podcast.isCustom && styles.podcastThemeCustom]}>{podcast.isCustom ? t("podcasts.custom") : podcast.theme}</Text>
              <Text style={styles.podcastTitle} numberOfLines={2}>
                {podcast.title}
              </Text>
              {podcast.isCustom && podcast.subject && podcast.subject !== podcast.title && (
                <Text style={styles.podcastSubject} numberOfLines={2}>
                  {podcast.subject}
                </Text>
              )}
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
                    ? t("podcasts.statusGenerating")
                    : podcast.status === "error"
                      ? t("podcasts.statusFailed")
                      : t(langKey)}
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

function CityPodcastSection({
  cityId,
  podcasts,
  expanded,
  onToggle,
  onDelete,
  locale,
  t,
}: {
  cityId: string;
  podcasts: Podcast[];
  expanded: boolean;
  onToggle: () => void;
  onDelete: (id: string) => void;
  locale: string;
  t: (key: string, options?: Record<string, any>) => string;
}) {
  const entry = getRegistryEntry(cityId);
  if (!entry) return null;
  const config = getCityConfigSync(cityId);
  const cityName = getLocalizedCityName(config, locale);
  const readyCount = podcasts.filter((p) => p.status === "ready").length;
  const generatingCount = podcasts.filter((p) => p.status === "generating").length;
  const totalCount = podcasts.length;

  return (
    <View style={styles.citySection}>
      <Pressable
        style={({ pressed }) => [
          styles.cityHeader,
          expanded && styles.cityHeaderExpanded,
          pressed && styles.cityHeaderPressed,
        ]}
        onPress={onToggle}
      >
        <Text style={styles.cityFlag}>{flagEmoji(entry.countryCode)}</Text>
        <View style={styles.cityHeaderText}>
          <Text style={styles.cityHeaderName}>{cityName}</Text>
          <Text style={styles.cityHeaderMeta}>
            {totalCount === 0
              ? t("cities.podcastCountEmpty")
              : t("cities.podcastCountLabel", { count: readyCount }) +
                (generatingCount > 0 ? ` · ${t("podcasts.generating", { count: generatingCount })}` : "")}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={Colors.light.textSecondary}
        />
      </Pressable>

      {expanded && (
        <View style={styles.podcastList}>
          {podcasts.length === 0 ? (
            <View style={styles.cityEmptyState}>
              <Ionicons name="headset-outline" size={28} color={Colors.light.textTertiary} />
              <Text style={styles.cityEmptyText}>{t("cities.emptyForCity")}</Text>
            </View>
          ) : (
            podcasts.map((podcast) => (
              <SwipeablePodcastCard
                key={podcast.id}
                podcast={podcast}
                onDelete={onDelete}
                t={t}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

function GlobalEmptyState({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="headset-outline" size={48} color={Colors.light.textTertiary} />
      <Text style={styles.emptyTitle}>{t("podcasts.emptyTitle")}</Text>
      <Text style={styles.emptyDescription}>
        {t("podcasts.emptyDescription")}
      </Text>
    </View>
  );
}

export default function PodcastsScreen() {
  const { podcastsByCity, isLoading, removePodcast } = usePodcasts();
  const { activeCityIds, currentCityId } = useCityConfig();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { t, locale } = useTranslation();

  const [expandedCities, setExpandedCities] = useState<Set<string>>(
    () => new Set([currentCityId]),
  );

  useEffect(() => {
    setExpandedCities(new Set([currentCityId]));
  }, [currentCityId]);

  const handleDelete = useCallback(
    async (id: string) => {
      const allPodcasts = Object.values(podcastsByCity).flat();
      const podcast = allPodcasts.find((p) => p.id === id);
      if (podcast?.isCustom && podcast?.customDbId) {
        try {
          await apiRequest("DELETE", `/api/podcast/custom/${podcast.customDbId}`, undefined, {
            cityId: podcast.cityId,
          });
        } catch (e) {
          console.error("Failed to delete custom podcast from server:", e);
        }
      }
      await removePodcast(id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [removePodcast, podcastsByCity],
  );

  const toggleCity = (cityId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCities((prev) => {
      const next = new Set(prev);
      if (next.has(cityId)) next.delete(cityId);
      else next.add(cityId);
      return next;
    });
  };

  const totals = useMemo(() => {
    const allPodcasts = Object.values(podcastsByCity).flat();
    return {
      ready: allPodcasts.filter((p) => p.status === "ready").length,
      generating: allPodcasts.filter((p) => p.status === "generating").length,
      total: allPodcasts.length,
    };
  }, [podcastsByCity]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  const allEmpty = totals.total === 0;

  return (
    <GestureHandlerRootView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 16 + webTopInset, paddingBottom: insets.bottom + 120 },
          allEmpty && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {allEmpty ? (
          <GlobalEmptyState t={t} />
        ) : (
          <>
            <View style={styles.headerSection}>
              <Text style={styles.headerTitle}>{t("podcasts.title")}</Text>
              <Text style={styles.headerSubtitle}>
                {t("podcasts.ready", { count: totals.ready })}
                {totals.generating > 0 && ` | ${t("podcasts.generating", { count: totals.generating })}`}
              </Text>
            </View>

            <View style={styles.cityList}>
              {activeCityIds.map((cityId) => (
                <CityPodcastSection
                  key={cityId}
                  cityId={cityId}
                  podcasts={podcastsByCity[cityId] ?? []}
                  expanded={expandedCities.has(cityId)}
                  onToggle={() => toggleCity(cityId)}
                  onDelete={handleDelete}
                  locale={locale}
                  t={t}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
  cityList: {
    gap: 14,
  },
  citySection: {
    gap: 10,
  },
  cityHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
  },
  cityHeaderExpanded: {
    borderColor: Colors.light.accent,
    backgroundColor: "#FFFCF5",
  },
  cityHeaderPressed: {
    opacity: 0.7,
  },
  cityFlag: {
    fontSize: 28,
  },
  cityHeaderText: {
    flex: 1,
  },
  cityHeaderName: {
    fontSize: 18,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  cityHeaderMeta: {
    fontSize: 12,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  podcastList: {
    gap: 12,
    paddingLeft: 8,
  },
  cityEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 10,
  },
  cityEmptyText: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  swipeContainer: {
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
  podcastSubject: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginTop: 2,
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
