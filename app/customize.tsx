import React, { useState, useRef } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getThemes, podcastLengths, checkLevelUp, getLocalizedName, getLocalizedDescription } from "@/constants/themes";
import { usePodcasts, type Podcast } from "@/contexts/PodcastContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";
import { useTranslation } from "@/i18n/useTranslation";

type Step = "angle" | "length" | "confirm";

function ChoiceCard({
  selected,
  onPress,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <Pressable
      style={[styles.choiceCard, selected && styles.choiceCardSelected]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}>{icon}</View>
      <View style={styles.choiceText}>
        <Text style={[styles.choiceTitle, selected && styles.choiceTitleSelected]}>{title}</Text>
        {subtitle ? (
          <Text style={styles.choiceSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={22} color={Colors.light.accent} />
      )}
    </Pressable>
  );
}

export default function CustomizeScreen() {
  const params = useLocalSearchParams<{
    topicId: string;
    topicName: string;
    topicNameNl: string;
    themeId: string;
    themeName: string;
    themeNameNl: string;
  }>();

  const { addPodcast, updatePodcast, podcasts } = usePodcasts();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { t, locale } = useTranslation();

  const voice = (user?.preferredVoice || "female") as "male" | "female";
  const language = (user?.preferredLanguage || "nl") as "nl" | "en" | "fr" | "de";

  const currentTheme = getThemes().find((th) => th.id === params.themeId);
  const currentTopic = currentTheme?.topics.find((tp) => tp.id === params.topicId);
  const hasAngles = !!(currentTheme?.angles && currentTheme.angles.length > 0);
  const steps: Step[] = hasAngles
    ? ["angle", "length", "confirm"]
    : ["length", "confirm"];

  const [currentStep, setCurrentStep] = useState(0);
  const [angle, setAngle] = useState("");
  const [length, setLength] = useState("short");
  const [isGenerating, setIsGenerating] = useState(false);

  const step = steps[currentStep];
  const canProceed =
    step === "angle" ? !!angle :
    step === "length" ? true :
    step === "confirm" ? true : false;

  const localizedTopicName = currentTopic ? getLocalizedName(currentTopic, locale) : params.topicName;

  const stepTitle = () => {
    switch (step) {
      case "angle": return t("customize.chooseAngle");
      case "length": return t("customize.podcastLength");
      case "confirm": return t("customize.readyToCreate");
    }
  };

  const stepSubtitle = () => {
    switch (step) {
      case "angle": return t("customize.howToTell");
      case "length": return t("customize.howLong");
      case "confirm": return t("customize.yourPodcastReady", { subject: localizedTopicName });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const readyCountRef = useRef(podcasts.filter((p) => p.status === "ready").length);
  readyCountRef.current = podcasts.filter((p) => p.status === "ready").length;
  const levelUpShownRef = useRef(false);

  const showLevelUpIfNeeded = () => {
    if (levelUpShownRef.current) return;
    const currentReady = readyCountRef.current;
    const newLevel = checkLevelUp(currentReady - 1, currentReady);
    if (newLevel) {
      levelUpShownRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Alert.alert(
          t("customize.levelUp", { level: getLocalizedName(newLevel, locale) }),
          getLocalizedDescription(newLevel, locale),
          [{ text: t("customize.merci"), style: "default" }]
        );
      }, 1500);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const podcastId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const selectedLength = podcastLengths.find((l) => l.id === length);

    const newPodcast: Podcast = {
      id: podcastId,
      title: params.topicName || "",
      titleNl: params.topicNameNl || "",
      theme: params.themeName || "",
      themeNl: params.themeNameNl || "",
      script: "",
      audioUrl: "",
      language,
      voice,
      perspective: angle,
      length,
      status: "generating",
      createdAt: new Date().toISOString(),
    };

    await addPodcast(newPodcast);

    router.dismissAll();
    setTimeout(() => {
      router.push("/(tabs)/podcasts");
    }, 100);

    try {
      const res = await apiRequest("POST", "/api/podcast/generate", {
        topicId: params.topicId,
        topicName: language === "nl" ? params.topicNameNl : params.topicName,
        topicNameNl: params.topicNameNl || params.topicName,
        themeName: language === "nl" ? params.themeNameNl : params.themeName,
        themeNameNl: params.themeNameNl || params.themeName,
        perspective: angle,
        voice,
        language,
        wordCount: selectedLength?.words || 750,
        lengthId: length,
      });

      const data = await res.json();

      if (data.status === "ready" && data.result) {
        await updatePodcast(podcastId, {
          script: data.result.script,
          audioUrl: data.result.audioUrl,
          durationSeconds: data.result.durationSeconds || 0,
          status: "ready",
        });
        showLevelUpIfNeeded();
      } else if (data.jobId) {
        const pollForResult = async () => {
          const maxAttempts = 120;
          for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            try {
              const pollRes = await apiRequest("GET", `/api/podcast/job/${data.jobId}`);
              if (pollRes.status === 404) {
                await updatePodcast(podcastId, {
                  status: "error",
                  errorMessage: t("errors.generationInterrupted"),
                });
                return;
              }
              const pollData = await pollRes.json();

              if (pollData.status === "ready" && pollData.result) {
                await updatePodcast(podcastId, {
                  script: pollData.result.script,
                  audioUrl: pollData.result.audioUrl,
                  durationSeconds: pollData.result.durationSeconds || 0,
                  status: "ready",
                });
                showLevelUpIfNeeded();
                return;
              } else if (pollData.status === "error") {
                await updatePodcast(podcastId, {
                  status: "error",
                  errorMessage: pollData.error || t("errors.generationFailed"),
                });
                return;
              }
            } catch {
            }
          }
          await updatePodcast(podcastId, {
            status: "error",
            errorMessage: t("errors.generationTimedOut"),
          });
        };
        pollForResult();
      }
    } catch (error) {
      console.error("Generation failed:", error);
      await updatePodcast(podcastId, {
        status: "error",
        errorMessage: t("errors.generationFailed"),
      });
    }
  };

  const selectedLength = podcastLengths.find((l) => l.id === length);
  const selectedAngle = currentTheme?.angles?.find((a) => a.id === angle);

  const renderStepContent = () => {
    switch (step) {
      case "angle":
        return (
          <View style={styles.choicesContainer}>
            {(currentTheme?.angles || []).map((a) => (
              <ChoiceCard
                key={a.id}
                selected={angle === a.id}
                onPress={() => setAngle(a.id)}
                icon={<Feather name={a.icon as any} size={20} color={angle === a.id ? Colors.light.accent : Colors.light.textSecondary} />}
                title={getLocalizedName(a, locale)}
                subtitle={getLocalizedDescription(a, locale)}
              />
            ))}
          </View>
        );

      case "length":
        return (
          <View style={styles.choicesContainer}>
            {podcastLengths.map((l) => (
              <ChoiceCard
                key={l.id}
                selected={length === l.id}
                onPress={() => setLength(l.id)}
                icon={<Feather name="clock" size={20} color={length === l.id ? Colors.light.accent : Colors.light.textSecondary} />}
                title={getLocalizedName(l, locale)}
                subtitle={l.duration}
              />
            ))}
          </View>
        );

      case "confirm":
        return (
          <View style={styles.confirmContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("customize.topic")}</Text>
                <Text style={styles.summaryValue} numberOfLines={1}>{localizedTopicName}</Text>
              </View>
              {hasAngles && selectedAngle ? (
                <>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t("customize.angle")}</Text>
                    <Text style={styles.summaryValue}>{getLocalizedName(selectedAngle, locale)}</Text>
                  </View>
                </>
              ) : null}
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("customize.length")}</Text>
                <Text style={styles.summaryValue}>{selectedLength ? getLocalizedName(selectedLength, locale) : ""} ({selectedLength?.duration})</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("customize.languageLabel")}</Text>
                <Text style={styles.summaryValue}>{t(`languages.${language}`)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("customize.voiceLabel")}</Text>
                <Text style={styles.summaryValue}>{voice === "female" ? t("customize.female") : t("customize.male")}</Text>
              </View>
            </View>

            <Text style={styles.confirmNote}>
              {t("customize.languageVoiceNote")}
            </Text>
            <Text style={styles.aiDisclosure}>
              {t("customize.aiDisclosure")}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 12 + webTopInset }]}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Ionicons
            name={currentStep === 0 ? "close" : "arrow-back"}
            size={24}
            color={Colors.light.text}
          />
        </Pressable>
        <View style={styles.progressContainer}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <Text style={styles.topicLabel}>{localizedTopicName}</Text>
          <Text style={styles.stepTitle}>{stepTitle()}</Text>
          <Text style={styles.stepSubtitle}>{stepSubtitle()}</Text>
        </View>

        {renderStepContent()}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 + (Platform.OS === "web" ? 34 : 0) }]}>
        {step === "confirm" ? (
          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              pressed && styles.buttonPressed,
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                <Text style={styles.generateButtonText}>{t("customize.createPodcast")}</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.buttonPressed,
              !canProceed && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={!canProceed}
          >
            <Text style={styles.nextButtonText}>{t("customize.continue")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.divider,
  },
  progressDotActive: {
    backgroundColor: Colors.light.accent,
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  stepHeader: {
    marginBottom: 28,
  },
  topicLabel: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontFamily: "DMSans_700Bold",
    color: Colors.light.primary,
    letterSpacing: -0.3,
  },
  stepSubtitle: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 6,
    lineHeight: 21,
  },
  choicesContainer: {
    gap: 12,
  },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.cardBorder,
    padding: 16,
    gap: 14,
  },
  choiceCardSelected: {
    borderColor: Colors.light.accent,
    backgroundColor: "#FFFCF5",
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceIconSelected: {
    backgroundColor: "rgba(196, 162, 101, 0.12)",
  },
  choiceText: {
    flex: 1,
  },
  choiceTitle: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
  },
  choiceTitleSelected: {
    color: Colors.light.primary,
  },
  choiceSubtitle: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  confirmContainer: {
    gap: 20,
  },
  summaryCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.cardBorder,
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.light.divider,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.text,
    maxWidth: "60%" as any,
    textAlign: "right" as const,
  },
  confirmNote: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 20,
  },
  aiDisclosure: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
    marginTop: 8,
    opacity: 0.7,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.divider,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#FFFFFF",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accent,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontFamily: "DMSans_600SemiBold",
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
