import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Image,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as StoreReview from "expo-store-review";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { getUserLevel, getNextLevel, getLocalizedName } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";
import { usePodcasts } from "@/contexts/PodcastContext";
import { getApiUrl, getCityHeaders } from "@/lib/query-client";
import { useTranslation } from "@/i18n/useTranslation";
import { useCityConfig } from "@/contexts/CityConfigContext";
import { flagEmoji, getRegistryEntry } from "@/constants/cityRegistry";
import { getCityConfigSync, getLocalizedCityName } from "@/constants/city";

const APP_ICON = require("@/assets/images/icon.png");

const LANGUAGES = [
  { id: "en", flag: "EN" },
  { id: "nl", flag: "NL" },
  { id: "fr", flag: "FR" },
  { id: "de", flag: "DE" },
  { id: "es", flag: "ES" },
];

const VOICES = [
  { id: "female", icon: "woman" as const },
  { id: "male", icon: "man" as const },
];

function ProfileHeader({ user, level, podcastCount, t, locale }: { user: { id: string; email?: string; firstName?: string }; level: ReturnType<typeof getUserLevel>; podcastCount: number; t: (key: string, options?: Record<string, any>) => string; locale: string }) {
  const initial = user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "?");
  const nextLevel = getNextLevel(podcastCount);
  const progress = nextLevel
    ? (podcastCount - level.minPodcasts) / (nextLevel.minPodcasts - level.minPodcasts)
    : 1;

  return (
    <View style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.profileName}>{user.firstName || getLocalizedName(level, locale)}</Text>
      {user.email && <Text style={styles.profileEmail}>{user.email}</Text>}
      <View style={styles.levelBadge}>
        <Ionicons name={level.icon as any} size={16} color={Colors.light.accent} />
        <Text style={styles.levelBadgeText}>{getLocalizedName(level, locale)}</Text>
      </View>
      {nextLevel && (
        <View style={styles.levelProgressContainer}>
          <View style={styles.levelProgressBar}>
            <View style={[styles.levelProgressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.levelProgressText}>
            {t("profile.moreTo", { count: nextLevel.minPodcasts - podcastCount, level: getLocalizedName(nextLevel, locale) })}
          </Text>
        </View>
      )}
    </View>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color="#C4A265" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress, destructive }: { icon: string; label: string; onPress: () => void; destructive?: boolean }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Ionicons
        name={icon as any}
        size={20}
        color={destructive ? Colors.light.error : Colors.light.textSecondary}
      />
      <Text style={[styles.menuItemLabel, destructive && styles.menuItemLabelDestructive]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.light.textTertiary} />
    </Pressable>
  );
}

function MyCitiesSection({ t, locale }: { t: (key: string, options?: Record<string, any>) => string; locale: string }) {
  const { activeCityIds, currentCityId, setCurrentCity, removeCity } = useCityConfig();
  const [editing, setEditing] = useState(false);

  const handleTap = async (cityId: string) => {
    if (cityId === currentCityId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await setCurrentCity(cityId);
  };

  const handleRemove = async (cityId: string) => {
    if (activeCityIds.length <= 1) {
      Alert.alert(t("common.error"), t("cities.cannotRemoveLast"));
      return;
    }
    const cityName = getLocalizedCityName(getCityConfigSync(cityId), locale);
    Alert.alert(
      t("cities.removeTitle", { city: cityName }),
      t("cities.removeMessage", { city: cityName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("cities.remove"),
          style: "destructive",
          onPress: async () => {
            await removeCity(cityId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>{t("cities.sectionTitle")}</Text>
        {activeCityIds.length > 0 && (
          <Pressable onPress={() => setEditing((v) => !v)} hitSlop={8}>
            <Text style={styles.sectionAction}>{editing ? t("cities.done") : t("cities.edit")}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.menuCard}>
        {activeCityIds.map((cityId, idx) => {
          const entry = getRegistryEntry(cityId);
          if (!entry) return null;
          const config = getCityConfigSync(cityId);
          const cityName = getLocalizedCityName(config, locale);
          const isActive = cityId === currentCityId;
          return (
            <React.Fragment key={cityId}>
              {idx > 0 && <View style={styles.menuDivider} />}
              <Pressable
                style={({ pressed }) => [
                  styles.cityRow,
                  isActive && styles.cityRowActive,
                  pressed && !editing && styles.menuItemPressed,
                ]}
                onPress={() => (editing ? null : handleTap(cityId))}
                disabled={editing}
              >
                <Text style={styles.cityFlag}>{flagEmoji(entry.countryCode)}</Text>
                <View style={styles.cityRowText}>
                  <Text style={styles.cityRowName}>{cityName}</Text>
                  {isActive && (
                    <Text style={styles.cityRowActiveLabel}>{t("cities.activeBadge")}</Text>
                  )}
                </View>
                {editing ? (
                  <Pressable
                    onPress={() => handleRemove(cityId)}
                    style={styles.removeIconButton}
                    hitSlop={8}
                    disabled={activeCityIds.length <= 1}
                  >
                    <Ionicons
                      name="remove-circle"
                      size={22}
                      color={activeCityIds.length <= 1 ? Colors.light.textTertiary : Colors.light.error}
                    />
                  </Pressable>
                ) : isActive ? (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.accent} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={Colors.light.textTertiary} />
                )}
              </Pressable>
            </React.Fragment>
          );
        })}
        <View style={styles.menuDivider} />
        <Pressable
          style={({ pressed }) => [styles.addCityRow, pressed && styles.menuItemPressed]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/city-picker" as any);
          }}
        >
          <View style={styles.addCityIcon}>
            <Ionicons name="add" size={20} color={Colors.light.accent} />
          </View>
          <Text style={styles.addCityText}>{t("cities.addCity")}</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.light.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { user, logout, deleteAccount, updatePreferences } = useAuth();
  const { podcasts } = usePodcasts();
  const [isDeleting, setIsDeleting] = useState(false);
  const { t, locale } = useTranslation();
  const { cityConfig, currentCityId } = useCityConfig();

  const totalPodcasts = podcasts.filter((p) => p.status === "ready").length;
  const standardPodcasts = podcasts.filter((p) => p.status === "ready" && !p.isCustom).length;
  const customPodcasts = podcasts.filter((p) => p.status === "ready" && p.isCustom).length;
  const level = getUserLevel(totalPodcasts);

  const handleLanguageChange = async (langId: string) => {
    if (langId === user?.preferredLanguage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await updatePreferences({ preferredLanguage: langId });
    if (!result.success) {
      Alert.alert(t("profile.errorTitle"), result.error || t("profile.errorUpdatePreferences"));
    }
  };

  const handleVoiceChange = async (voiceId: string) => {
    if (voiceId === user?.preferredVoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await updatePreferences({ preferredVoice: voiceId });
    if (!result.success) {
      Alert.alert(t("profile.errorTitle"), result.error || t("profile.errorUpdatePreferences"));
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout();
      return;
    }
    Alert.alert(t("profile.signOutConfirmTitle"), t("profile.signOutConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("profile.signOut"), style: "destructive", onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteConfirmTitle"),
      t("profile.deleteConfirmMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            const result = await deleteAccount();
            setIsDeleting(false);
            if (!result.success) {
              Alert.alert(t("profile.errorTitle"), result.error || t("errors.somethingWentWrong"));
            }
          },
        },
      ],
    );
  };

  const openPrivacyPolicy = () => {
    const baseUrl = getApiUrl();
    const cityId = getCityHeaders()["X-City-Id"] || currentCityId;
    Linking.openURL(`${baseUrl}/privacy-policy?city=${cityId}`);
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      {isDeleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.accent} />
          <Text style={styles.deletingText}>{t("profile.deletingAccount")}</Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 + webTopInset, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>{t("profile.title")}</Text>

        <ProfileHeader user={user} level={level} podcastCount={totalPodcasts} t={t} locale={locale} />

        <View style={styles.statsRow}>
          <StatCard icon="headset" value={standardPodcasts} label={t("profile.standard")} />
          <StatCard icon="create-outline" value={customPodcasts} label={t("profile.custom")} />
        </View>

        <MyCitiesSection t={t} locale={locale} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.podcastPreferences")}</Text>
          <View style={styles.menuCard}>
            <View style={styles.prefSection}>
              <View style={styles.prefLabelRow}>
                <Ionicons name="language-outline" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.prefLabel}>{t("profile.language")}</Text>
              </View>
              <View style={styles.prefOptions}>
                {LANGUAGES.map((lang) => (
                  <Pressable
                    key={lang.id}
                    style={[
                      styles.prefChip,
                      user?.preferredLanguage === lang.id && styles.prefChipSelected,
                    ]}
                    onPress={() => handleLanguageChange(lang.id)}
                  >
                    <Text
                      style={[
                        styles.prefChipText,
                        user?.preferredLanguage === lang.id && styles.prefChipTextSelected,
                      ]}
                    >
                      {lang.flag}
                    </Text>
                    <Text
                      style={[
                        styles.prefChipLabel,
                        user?.preferredLanguage === lang.id && styles.prefChipLabelSelected,
                      ]}
                    >
                      {t(`languages.${lang.id}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.prefSection}>
              <View style={styles.prefLabelRow}>
                <Ionicons name="mic-outline" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.prefLabel}>{t("profile.voice")}</Text>
              </View>
              <View style={styles.prefOptions}>
                {VOICES.map((v) => (
                  <Pressable
                    key={v.id}
                    style={[
                      styles.prefChip,
                      styles.prefChipWide,
                      user?.preferredVoice === v.id && styles.prefChipSelected,
                    ]}
                    onPress={() => handleVoiceChange(v.id)}
                  >
                    <Ionicons
                      name={v.icon}
                      size={16}
                      color={user?.preferredVoice === v.id ? Colors.light.accent : Colors.light.textSecondary}
                    />
                    <Text
                      style={[
                        styles.prefChipLabel,
                        user?.preferredVoice === v.id && styles.prefChipLabelSelected,
                      ]}
                    >
                      {t(`profile.${v.id}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.about")}</Text>
          <View style={styles.menuCard}>
            <View style={styles.aboutRow}>
              <Image
                source={APP_ICON}
                style={styles.aboutIcon}
              />
              <View style={styles.aboutText}>
                <Text style={styles.aboutAppName}>{t("profile.appName")}</Text>
                <Text style={styles.aboutVersion}>{t("profile.appVersion")}</Text>
              </View>
            </View>
            <Text style={styles.aboutDescription}>
              {t("profile.appDescription")}
            </Text>
            <MenuItem icon="star-outline" label={t("profile.rateApp")} onPress={async () => {
              const isAvailable = await StoreReview.isAvailableAsync();
              if (isAvailable) {
                await StoreReview.requestReview();
              }
            }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.legal")}</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="shield-checkmark-outline" label={t("profile.privacyPolicy")} onPress={openPrivacyPolicy} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.account")}</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="log-out-outline" label={t("profile.signOut")} onPress={handleLogout} destructive />
            <View style={styles.menuDivider} />
            <MenuItem icon="trash-outline" label={t("profile.deleteAccount")} onPress={handleDeleteAccount} destructive />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 34,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.primary,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: "DMSans_700Bold",
    color: "#FFFFFF",
  },
  profileName: {
    fontSize: 22,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
  },
  menuItemLabelDestructive: {
    color: Colors.light.error,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  cityRowActive: {
    backgroundColor: "#FFFCF5",
  },
  cityFlag: {
    fontSize: 28,
  },
  cityRowText: {
    flex: 1,
  },
  cityRowName: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
  },
  cityRowActiveLabel: {
    fontSize: 11,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.accent,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 2,
  },
  removeIconButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  addCityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  addCityIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(196, 162, 101, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  addCityText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.accent,
  },
  aboutRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  aboutIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  aboutText: {
    flex: 1,
  },
  aboutAppName: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
  },
  aboutVersion: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  aboutDescription: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    lineHeight: 21,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.light.cardBorder,
    marginHorizontal: 16,
  },
  prefSection: {
    padding: 16,
  },
  prefLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  prefLabel: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
  },
  prefOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  prefChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.cardBorder,
    backgroundColor: Colors.light.background,
  },
  prefChipWide: {
    flex: 1,
    justifyContent: "center",
  },
  prefChipSelected: {
    borderColor: Colors.light.accent,
    backgroundColor: "#FFFCF5",
  },
  prefChipText: {
    fontSize: 13,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.textSecondary,
  },
  prefChipTextSelected: {
    color: Colors.light.accent,
  },
  prefChipLabel: {
    fontSize: 13,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
  },
  prefChipLabelSelected: {
    color: Colors.light.accent,
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  deletingText: {
    fontSize: 16,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.text,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#FFFCF5",
    borderWidth: 1,
    borderColor: Colors.light.accent,
  },
  levelBadgeText: {
    fontSize: 13,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.accent,
  },
  levelProgressContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 32,
  },
  levelProgressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.cardBorder,
    overflow: "hidden",
  },
  levelProgressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: Colors.light.accent,
  },
  levelProgressText: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    marginTop: 6,
  },
});
