import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { podcastLengths, checkLevelUp, getLocalizedName, getLocalizedDescription } from "@/constants/themes";
import { usePodcasts, type Podcast } from "@/contexts/PodcastContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, getApiUrl, getCityHeaders } from "@/lib/query-client";
import { auth as firebaseAuth } from "@/lib/firebase";
import { useTranslation } from "@/i18n/useTranslation";

type Step = "subject" | "angle" | "length" | "confirm";

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

export default function CustomCreateScreen() {
  const { addPodcast, updatePodcast, removePodcast, podcasts } = usePodcasts();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const inputRef = useRef<TextInput>(null);
  const { t, locale } = useTranslation();

  const voice = (user?.preferredVoice || "female") as "male" | "female";
  const language = (user?.preferredLanguage || "nl") as "nl" | "en" | "fr" | "de";

  const steps: Step[] = ["subject", "angle", "length", "confirm"];

  const [currentStep, setCurrentStep] = useState(0);
  const [subject, setSubject] = useState("");
  const [angle, setAngle] = useState("");
  const [length, setLength] = useState("short");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customRemaining, setCustomRemaining] = useState<number | null>(null);
  const [limitLoading, setLimitLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/podcast/custom-limit");
        const data = await res.json();
        setCustomRemaining(data.remaining ?? null);
      } catch {
        setCustomRemaining(null);
      } finally {
        setLimitLoading(false);
      }
    })();
  }, []);

  const step = steps[currentStep];
  const trimmedSubject = subject.trim();

  const canProceed =
    step === "subject" ? trimmedSubject.length >= 3 :
    step === "angle" ? !!angle :
    true;

  const stepTitle = () => {
    switch (step) {
      case "subject": return t("customCreate.yourSubject");
      case "angle": return t("customCreate.chooseAngle");
      case "length": return t("customCreate.podcastLength");
      case "confirm": return t("customCreate.readyToCreate");
    }
  };

  const stepSubtitle = () => {
    switch (step) {
      case "subject": return t("customCreate.whatStory");
      case "angle": return t("customCreate.howToTell");
      case "length": return t("customCreate.howLong");
      case "confirm": return t("customCreate.yourPodcastReady");
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
      title: trimmedSubject,
      titleNl: trimmedSubject,
      theme: "Custom",
      themeNl: "Eigen",
      script: "",
      audioUrl: "",
      language,
      voice,
      perspective: angle,
      length,
      status: "generating",
      createdAt: new Date().toISOString(),
      isCustom: true,
    };

    try {
      const baseUrl = getApiUrl();
      const token = firebaseAuth.currentUser ? await firebaseAuth.currentUser.getIdToken() : null;
      const headers: Record<string, string> = { "Content-Type": "application/json", ...getCityHeaders() };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}/api/podcast/generate-custom`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          subject: trimmedSubject,
          angle,
          voice,
          language,
          wordCount: selectedLength?.words || 400,
          lengthId: length,
        }),
      });

      if (!res.ok) {
        let errorData: any = {};
        try { errorData = await res.json(); } catch {}
        if (errorData.code === "CUSTOM_LIMIT_REACHED") {
          Alert.alert(t("customCreate.limitReachedTitle"), t("customCreate.limitReachedMessage"));
          setCustomRemaining(0);
        } else {
          Alert.alert(t("customCreate.topicNotSuitable"), t("customCreate.limitReachedMessage"));
        }
        setIsGenerating(false);
        return;
      }

      const data = await res.json();

      await addPodcast(newPodcast);

      router.dismissAll();
      setTimeout(() => {
        router.push("/(tabs)/podcasts");
      }, 100);

      if (data.status === "ready" && data.result) {
        await updatePodcast(podcastId, {
          title: data.result.title || trimmedSubject,
          titleNl: data.result.title || trimmedSubject,
          subject: trimmedSubject,
          script: data.result.script,
          audioUrl: data.result.audioUrl,
          durationSeconds: data.result.durationSeconds || 0,
          status: "ready",
          customDbId: data.result.customDbId || data.result.id,
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
                  title: pollData.result.title || trimmedSubject,
                  titleNl: pollData.result.title || trimmedSubject,
                  subject: trimmedSubject,
                  script: pollData.result.script,
                  audioUrl: pollData.result.audioUrl,
                  durationSeconds: pollData.result.durationSeconds || 0,
                  status: "ready",
                  customDbId: pollData.result.customDbId || pollData.result.id,
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
      console.error("Custom generation failed:", error);
      Alert.alert(t("common.error"), t("errors.somethingWentWrong"));
      setIsGenerating(false);
    }
  };

  const selectedLength = podcastLengths.find((l) => l.id === length);
  const selectedAngleName = angle === "historical" ? t("customCreate.angleHistorical") : angle === "modern-culture" ? t("customCreate.angleModernCulture") : angle === "personal-stories" ? t("customCreate.anglePersonalStories") : angle;

  const renderStepContent = () => {
    switch (step) {
      case "subject":
        return (
          <View style={styles.subjectContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.subjectInput}
                placeholder={t("customCreate.placeholder")}
                placeholderTextColor={Colors.light.textTertiary}
                value={subject}
                onChangeText={setSubject}
                multiline
                maxLength={200}
                autoFocus
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{subject.length}/200</Text>
            </View>
            <Text style={styles.inputHint}>
              {t("customCreate.inputHint")}
            </Text>
            <Text style={styles.aiDisclosure}>
              {t("customize.aiDisclosure")}
            </Text>
          </View>
        );

      case "angle":
        return (
          <View style={styles.choicesContainer}>
            <ChoiceCard
              selected={angle === "historical"}
              onPress={() => setAngle("historical")}
              icon={<Feather name="book-open" size={20} color={angle === "historical" ? Colors.light.accent : Colors.light.textSecondary} />}
              title={t("customCreate.angleHistorical")}
              subtitle={t("customCreate.angleHistoricalDesc")}
            />
            <ChoiceCard
              selected={angle === "modern-culture"}
              onPress={() => setAngle("modern-culture")}
              icon={<Feather name="trending-up" size={20} color={angle === "modern-culture" ? Colors.light.accent : Colors.light.textSecondary} />}
              title={t("customCreate.angleModernCulture")}
              subtitle={t("customCreate.angleModernCultureDesc")}
            />
            <ChoiceCard
              selected={angle === "personal-stories"}
              onPress={() => setAngle("personal-stories")}
              icon={<Feather name="heart" size={20} color={angle === "personal-stories" ? Colors.light.accent : Colors.light.textSecondary} />}
              title={t("customCreate.anglePersonalStories")}
              subtitle={t("customCreate.anglePersonalStoriesDesc")}
            />
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
                <Text style={styles.summaryLabel}>{t("customCreate.yourSubject")}</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>{trimmedSubject}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t("customize.angle")}</Text>
                <Text style={styles.summaryValue}>{selectedAngleName}</Text>
              </View>
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

  if (limitLoading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
      </View>
    );
  }

  if (customRemaining !== null && customRemaining <= 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 + webTopInset }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <Ionicons name="lock-closed-outline" size={48} color={Colors.light.textTertiary} />
          <Text style={{ fontSize: 22, fontFamily: "DMSans_700Bold", color: Colors.light.text, textAlign: "center", marginTop: 20 }}>
            {t("customCreate.customPodcastLimitReached")}
          </Text>
          <Text style={{ fontSize: 15, fontFamily: "DMSans_400Regular", color: Colors.light.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 22 }}>
            {t("customCreate.limitReachedDescription")}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed, { marginTop: 32, width: "100%" }]}
            onPress={() => { router.back(); }}
          >
            <Text style={styles.nextButtonText}>{t("customCreate.browseLibrary")}</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepHeader}>
          <View style={styles.customBadge}>
            <Feather name="edit-3" size={12} color={Colors.light.accent} />
            <Text style={styles.customBadgeText}>{t("podcasts.custom")}</Text>
          </View>
          <Text style={styles.stepTitle}>{stepTitle()}</Text>
          <Text style={styles.stepSubtitle}>{stepSubtitle()}</Text>
          {customRemaining !== null && step === "subject" && (
            <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: Colors.light.textTertiary, marginTop: 4 }}>
              {t("customCreate.remaining", { count: customRemaining })}
            </Text>
          )}
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
    </KeyboardAvoidingView>
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
  customBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  customBadgeText: {
    fontSize: 12,
    fontFamily: "DMSans_600SemiBold",
    color: Colors.light.accent,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
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
  subjectContainer: {
    gap: 16,
  },
  inputWrapper: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.cardBorder,
    padding: 16,
  },
  subjectInput: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.text,
    minHeight: 100,
    lineHeight: 24,
  },
  charCount: {
    fontSize: 12,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    textAlign: "right",
    marginTop: 8,
  },
  inputHint: {
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  aiDisclosure: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    color: Colors.light.textTertiary,
    lineHeight: 16,
    paddingHorizontal: 4,
    marginTop: 12,
    opacity: 0.7,
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
