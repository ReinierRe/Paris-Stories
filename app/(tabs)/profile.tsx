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
import Colors from "@/constants/colors";
import { getUserLevel, getNextLevel, userLevels } from "@/constants/themes";
import { useAuth } from "@/contexts/AuthContext";
import { usePodcasts } from "@/contexts/PodcastContext";
import { getApiUrl } from "@/lib/query-client";

const LANGUAGES = [
  { id: "nl", label: "Nederlands", flag: "NL" },
  { id: "en", label: "English", flag: "EN" },
  { id: "fr", label: "Fran\u00e7ais", flag: "FR" },
  { id: "de", label: "Deutsch", flag: "DE" },
];

const VOICES = [
  { id: "female", label: "Female", icon: "woman" as const },
  { id: "male", label: "Male", icon: "man" as const },
];

function ProfileHeader({ user, level, podcastCount }: { user: { id: string; email?: string; firstName?: string }; level: ReturnType<typeof getUserLevel>; podcastCount: number }) {
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
      <Text style={styles.profileName}>{user.firstName || "Traveler"}</Text>
      {user.email && <Text style={styles.profileEmail}>{user.email}</Text>}
      <View style={styles.levelBadge}>
        <Ionicons name={level.icon as any} size={16} color={Colors.light.accent} />
        <Text style={styles.levelBadgeText}>{level.name}</Text>
      </View>
      {nextLevel && (
        <View style={styles.levelProgressContainer}>
          <View style={styles.levelProgressBar}>
            <View style={[styles.levelProgressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={styles.levelProgressText}>
            {nextLevel.minPodcasts - podcastCount} more to {nextLevel.name}
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { user, logout, deleteAccount, updatePreferences } = useAuth();
  const { podcasts } = usePodcasts();
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPodcasts = podcasts.filter((p) => p.status === "ready").length;
  const standardPodcasts = podcasts.filter((p) => p.status === "ready" && !p.isCustom).length;
  const customPodcasts = podcasts.filter((p) => p.status === "ready" && p.isCustom).length;
  const level = getUserLevel(totalPodcasts);

  const handleLanguageChange = async (langId: string) => {
    if (langId === user?.preferredLanguage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await updatePreferences({ preferredLanguage: langId });
    if (!result.success) {
      Alert.alert("Error", result.error || "Could not update language preference");
    }
  };

  const handleVoiceChange = async (voiceId: string) => {
    if (voiceId === user?.preferredVoice) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await updatePreferences({ preferredVoice: voiceId });
    if (!result.success) {
      Alert.alert("Error", result.error || "Could not update voice preference");
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      logout();
      return;
    }
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete account",
      "This will permanently delete your account and all your podcasts. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            const result = await deleteAccount();
            setIsDeleting(false);
            if (!result.success) {
              Alert.alert("Error", result.error || "Failed to delete account");
            }
          },
        },
      ],
    );
  };

  const openPrivacyPolicy = () => {
    const baseUrl = getApiUrl();
    Linking.openURL(`${baseUrl}/privacy-policy`);
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      {isDeleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.accent} />
          <Text style={styles.deletingText}>Deleting account...</Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16 + webTopInset, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>My Profile</Text>

        <ProfileHeader user={user} level={level} podcastCount={totalPodcasts} />

        <View style={styles.statsRow}>
          <StatCard icon="headset" value={standardPodcasts} label="Standard" />
          <StatCard icon="create-outline" value={customPodcasts} label="Custom" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podcast Preferences</Text>
          <View style={styles.menuCard}>
            <View style={styles.prefSection}>
              <View style={styles.prefLabelRow}>
                <Ionicons name="language-outline" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.prefLabel}>Language</Text>
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
                      {lang.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.menuDivider} />
            <View style={styles.prefSection}>
              <View style={styles.prefLabelRow}>
                <Ionicons name="mic-outline" size={18} color={Colors.light.textSecondary} />
                <Text style={styles.prefLabel}>Voice</Text>
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
                      {v.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.menuCard}>
            <View style={styles.aboutRow}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.aboutIcon}
              />
              <View style={styles.aboutText}>
                <Text style={styles.aboutAppName}>Paris Stories</Text>
                <Text style={styles.aboutVersion}>Version 1.0.0</Text>
              </View>
            </View>
            <Text style={styles.aboutDescription}>
              Discover the hidden stories of Paris through AI-powered audio tours. From the French Revolution to hidden neighborhoods, every story is crafted with care.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={openPrivacyPolicy} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="log-out-outline" label="Sign out" onPress={handleLogout} destructive />
            <View style={styles.menuDivider} />
            <MenuItem icon="trash-outline" label="Delete account" onPress={handleDeleteAccount} destructive />
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
  sectionTitle: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingLeft: 4,
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
