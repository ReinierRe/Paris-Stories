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
import { podcastLengths } from "@/constants/themes";
import { usePodcasts, type Podcast } from "@/contexts/PodcastContext";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/query-client";

const LANGUAGE_LABELS: Record<string, string> = {
  nl: "Nederlands",
  en: "English",
  fr: "Fran\u00e7ais",
  de: "Deutsch",
};

type Step = "subject" | "angle" | "length" | "confirm";

const CUSTOM_ANGLES = [
  {
    id: "historical",
    name: "Historical",
    description: "Facts, dates, and chronological storytelling",
    icon: "book-open",
  },
  {
    id: "modern-culture",
    name: "Modern Culture",
    description: "Contemporary trends and modern-day significance",
    icon: "trending-up",
  },
  {
    id: "personal-stories",
    name: "Personal Stories",
    description: "Intimate anecdotes and first-person perspectives",
    icon: "heart",
  },
];

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
  const { addPodcast, updatePodcast, removePodcast } = usePodcasts();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const inputRef = useRef<TextInput>(null);

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
      case "subject": return "Your subject";
      case "angle": return "Choose your angle";
      case "length": return "Podcast length";
      case "confirm": return "Ready to create";
    }
  };

  const stepSubtitle = () => {
    switch (step) {
      case "subject": return "What Paris story would you like to hear?";
      case "angle": return "How should we tell this story?";
      case "length": return "How long should the podcast be?";
      case "confirm": return `Your podcast about "${trimmedSubject}" is ready to be created`;
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const podcastId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const selectedLength = podcastLengths.find((l) => l.id === length);
    const selectedAngle = CUSTOM_ANGLES.find((a) => a.id === angle);

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

    await addPodcast(newPodcast);

    router.dismissAll();
    setTimeout(() => {
      router.push("/(tabs)/podcasts");
    }, 100);

    try {
      const res = await apiRequest("POST", "/api/podcast/generate-custom", {
        subject: trimmedSubject,
        angle,
        voice,
        language,
        wordCount: selectedLength?.words || 400,
        lengthId: length,
      });

      const data = await res.json();

      if (!res.ok && data.error) {
        await removePodcast(podcastId);
        if (data.code === "CUSTOM_LIMIT_REACHED") {
          Alert.alert("Limit Reached", "You have used all 5 free custom podcasts. You can still create unlimited podcasts from the curated library.");
          setCustomRemaining(0);
        } else {
          Alert.alert("Topic Not Allowed", data.error);
        }
        setIsGenerating(false);
        return;
      }

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
                  errorMessage: "Generation was interrupted. Please try again.",
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
                return;
              } else if (pollData.status === "error") {
                await updatePodcast(podcastId, {
                  status: "error",
                  errorMessage: pollData.error || "Failed to generate podcast. Please try again.",
                });
                return;
              }
            } catch {
            }
          }
          await updatePodcast(podcastId, {
            status: "error",
            errorMessage: "Generation timed out. Please try again.",
          });
        };
        pollForResult();
      }
    } catch (error) {
      console.error("Custom generation failed:", error);
      await updatePodcast(podcastId, {
        status: "error",
        errorMessage: "Failed to generate podcast. Please try again.",
      });
    }
  };

  const selectedLength = podcastLengths.find((l) => l.id === length);
  const selectedAngle = CUSTOM_ANGLES.find((a) => a.id === angle);

  const renderStepContent = () => {
    switch (step) {
      case "subject":
        return (
          <View style={styles.subjectContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.subjectInput}
                placeholder="e.g., The hidden passages of Paris, Hemingway's favorite bars..."
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
              Enter any Paris-related subject. The AI will craft a unique podcast story about it.
            </Text>
            <Text style={styles.aiDisclosure}>
              Your topic will be processed by AI (Anthropic Claude) to generate a script, and by Google Cloud to create audio. See our Privacy Policy for details.
            </Text>
          </View>
        );

      case "angle":
        return (
          <View style={styles.choicesContainer}>
            {CUSTOM_ANGLES.map((a) => (
              <ChoiceCard
                key={a.id}
                selected={angle === a.id}
                onPress={() => setAngle(a.id)}
                icon={<Feather name={a.icon as any} size={20} color={angle === a.id ? Colors.light.accent : Colors.light.textSecondary} />}
                title={a.name}
                subtitle={a.description}
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
                title={l.name}
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
                <Text style={styles.summaryLabel}>Subject</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>{trimmedSubject}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Angle</Text>
                <Text style={styles.summaryValue}>{selectedAngle?.name}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Length</Text>
                <Text style={styles.summaryValue}>{selectedLength?.name} ({selectedLength?.duration})</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Language</Text>
                <Text style={styles.summaryValue}>{LANGUAGE_LABELS[language] || language}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Voice</Text>
                <Text style={styles.summaryValue}>{voice === "female" ? "Female" : "Male"}</Text>
              </View>
            </View>

            <Text style={styles.confirmNote}>
              Language and voice can be changed in your profile settings.
            </Text>
            <Text style={styles.aiDisclosure}>
              Your podcast will be generated using AI (Anthropic Claude) for the script and Google Cloud for audio. See our Privacy Policy for details.
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
            Custom podcast limit reached
          </Text>
          <Text style={{ fontSize: 15, fontFamily: "DMSans_400Regular", color: Colors.light.textSecondary, textAlign: "center", marginTop: 12, lineHeight: 22 }}>
            You have used all 5 free custom podcasts. You can still create unlimited podcasts from our curated library.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed, { marginTop: 32, width: "100%" }]}
            onPress={() => { router.back(); }}
          >
            <Text style={styles.nextButtonText}>Browse Library</Text>
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
            <Text style={styles.customBadgeText}>Custom Podcast</Text>
          </View>
          <Text style={styles.stepTitle}>{stepTitle()}</Text>
          <Text style={styles.stepSubtitle}>{stepSubtitle()}</Text>
          {customRemaining !== null && step === "subject" && (
            <Text style={{ fontSize: 13, fontFamily: "DMSans_400Regular", color: Colors.light.textTertiary, marginTop: 4 }}>
              {customRemaining} of 5 free custom podcasts remaining
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
                <Text style={styles.generateButtonText}>Create Podcast</Text>
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
            <Text style={styles.nextButtonText}>Continue</Text>
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
