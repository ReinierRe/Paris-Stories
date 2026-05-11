import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useTranslation } from "@/i18n/useTranslation";
import { useCityConfig } from "@/contexts/CityConfigContext";
import { CITY_REGISTRY, flagEmoji, getRegistryEntry } from "@/constants/cityRegistry";
import { getCityConfigSync, getLocalizedCityName } from "@/constants/city";

type DownloadState = "idle" | "downloading" | "error";

export default function CityPickerScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const { activeCityIds, addCity, removeCity, setCurrentCity } = useCityConfig();
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  const handleAdd = useCallback(
    async (cityId: string) => {
      const entry = getRegistryEntry(cityId);
      if (!entry) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (entry.delivery === "remote") {
        setDownloads((prev) => ({ ...prev, [cityId]: "downloading" }));
        try {
          await addCity(cityId);
          await setCurrentCity(cityId);
          setDownloads((prev) => {
            const next = { ...prev };
            delete next[cityId];
            return next;
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err) {
          console.error(`Failed to download city ${cityId}:`, err);
          setDownloads((prev) => ({ ...prev, [cityId]: "error" }));
          Alert.alert(t("common.error"), t("cities.downloadFailed"));
        }
      } else {
        await addCity(cityId);
        await setCurrentCity(cityId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [addCity, setCurrentCity, t],
  );

  const handleRemove = useCallback(
    async (cityId: string) => {
      if (activeCityIds.length <= 1) {
        Alert.alert(t("common.error"), t("cities.cannotRemoveLast"));
        return;
      }
      const entry = getRegistryEntry(cityId);
      const cityName = entry ? getLocalizedCityName(getCityConfigSync(cityId), locale) : cityId;
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
    },
    [activeCityIds, removeCity, t, locale],
  );

  const activeEntries = CITY_REGISTRY.filter((c) => activeCityIds.includes(c.id));
  const availableEntries = CITY_REGISTRY.filter((c) => !activeCityIds.includes(c.id));

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="close" size={28} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{t("cities.pickerTitle")}</Text>
          <Text style={styles.headerSubtitle}>{t("cities.pickerSubtitle")}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("cities.pickerActive")}</Text>
            <View style={styles.menuCard}>
              {activeEntries.map((entry, idx) => {
                const config = getCityConfigSync(entry.id);
                const cityName = getLocalizedCityName(config, locale);
                return (
                  <React.Fragment key={entry.id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.row}>
                      <Text style={styles.flag}>{flagEmoji(entry.countryCode)}</Text>
                      <View style={styles.rowText}>
                        <Text style={styles.cityName}>{cityName}</Text>
                        <Text style={styles.cityMeta}>
                          {entry.delivery === "bundled"
                            ? t("cities.bundled")
                            : t("cities.onDemand")}
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                        onPress={() => handleRemove(entry.id)}
                        disabled={activeCityIds.length <= 1}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={activeCityIds.length <= 1 ? Colors.light.textTertiary : Colors.light.error}
                        />
                      </Pressable>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {availableEntries.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("cities.pickerAvailable")}</Text>
            <View style={styles.menuCard}>
              {availableEntries.map((entry, idx) => {
                const config = getCityConfigSync(entry.id);
                const cityName = getLocalizedCityName(config, locale);
                const downloadState = downloads[entry.id];
                const isDownloading = downloadState === "downloading";
                return (
                  <React.Fragment key={entry.id}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.row}>
                      <Text style={styles.flag}>{flagEmoji(entry.countryCode)}</Text>
                      <View style={styles.rowText}>
                        <Text style={styles.cityName}>{cityName}</Text>
                        <Text style={styles.cityMeta}>
                          {entry.delivery === "bundled"
                            ? t("cities.bundled")
                            : t("cities.onDemand")}
                        </Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.addButton,
                          isDownloading && styles.addButtonDisabled,
                          pressed && styles.pressed,
                        ]}
                        onPress={() => handleAdd(entry.id)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <ActivityIndicator size="small" color={Colors.light.accent} />
                            <Text style={styles.addButtonText}>{t("cities.downloading")}</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name={entry.delivery === "remote" ? "cloud-download-outline" : "add"}
                              size={16}
                              color={Colors.light.accent}
                            />
                            <Text style={styles.addButtonText}>
                              {entry.delivery === "remote" ? t("cities.download") : t("cities.add")}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.comingSoonContainer}>
            <Ionicons name="globe-outline" size={36} color={Colors.light.textTertiary} />
            <Text style={styles.comingSoonText}>{t("cities.comingSoon")}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  headerTextContainer: {
    flex: 1,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  flag: {
    fontSize: 32,
  },
  rowText: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
  },
  cityMeta: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.divider,
    marginLeft: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.accent,
    backgroundColor: "#FFFCF5",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 13,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.6,
  },
  comingSoonContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 12,
  },
  comingSoonText: {
    fontSize: 14,
    fontFamily: "DMSans_500Medium",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
