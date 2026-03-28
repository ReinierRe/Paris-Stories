import React, { useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  FlatList,
  ViewToken,
  Keyboard,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/query-client";
import {
  onboardingSlides,
  OnboardingSlide,
  onboardingCategories,
  onboardingPodcastExamples,
  onboardingCategoryTopicCounts,
  onboardingCustomSubjectExample,
} from "@/constants/onboarding";
import { getCityConfigSync } from "@/constants/city";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Mode = "login" | "register";

const slides = onboardingSlides;

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <View style={mockupStyles.phoneFrame}>
      <View style={mockupStyles.phoneNotch}>
        <Text style={mockupStyles.phoneTime}>13:12</Text>
        <View style={mockupStyles.phoneNotchDot} />
      </View>
      <View style={mockupStyles.phoneContent}>
        {children}
      </View>
    </View>
  );
}

function PodcastItem({ category, title, voice, duration, lang, color }: {
  category: string; title: string; voice: string; duration: string; lang: string; color: string;
}) {
  return (
    <View style={mockupStyles.podcastItem}>
      <Text style={[mockupStyles.podcastCategory, { color }]}>{category}</Text>
      <Text style={mockupStyles.podcastTitle}>{title}</Text>
      <View style={mockupStyles.podcastMeta}>
        <Text style={mockupStyles.podcastMetaText}>{lang}</Text>
        <View style={mockupStyles.podcastMetaDot} />
        <Text style={mockupStyles.podcastMetaText}>{voice}</Text>
        <View style={mockupStyles.podcastMetaDot} />
        <Text style={mockupStyles.podcastMetaText}>{duration}</Text>
      </View>
    </View>
  );
}

const categoryImageMap: Record<string, any> = {
  "category-history": require("@/assets/images/category-history.png"),
  "category-french-revolution": require("@/assets/images/category-french-revolution.png"),
  "category-museums": require("@/assets/images/category-museums.png"),
  "category-epic-buildings": require("@/assets/images/category-epic-buildings.png"),
  "category-modern-history": require("@/assets/images/category-modern-history.png"),
  "category-culinary": require("@/assets/images/category-culinary.png"),
  "category-neighborhoods": require("@/assets/images/category-neighborhoods.png"),
};

function SlideContent({ slide, index }: { slide: OnboardingSlide; index: number }) {
  const categoryIcons = onboardingCategories.map((cat) => ({
    name: cat.name,
    image: categoryImageMap[cat.imageKey],
  }));

  if (index === 0) {
    return (
      <View style={slideStyles.visualContainer}>
        <View style={slideStyles.iconGrid}>
          {categoryIcons.slice(0, 6).map((cat, i) => (
            <View key={i} style={slideStyles.iconGridItem}>
              <Image source={cat.image} style={slideStyles.categoryIcon} cachePolicy="memory-disk" />
              <Text style={slideStyles.iconLabel}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (index === 1) {
    return (
      <View style={slideStyles.visualContainer}>
        <PhoneMockup>
          <Text style={mockupStyles.screenTitle}>My Podcasts</Text>
          <Text style={mockupStyles.screenSubtitle}>20 ready</Text>
          {onboardingPodcastExamples.map((ex, i) => (
            <PodcastItem key={i} category={ex.category} title={ex.title} voice={ex.voice} duration={ex.duration} lang={ex.lang} color={ex.color} />
          ))}
        </PhoneMockup>
      </View>
    );
  }

  if (index === 2) {
    return (
      <View style={slideStyles.visualContainer}>
        <PhoneMockup>
          <Text style={mockupStyles.screenTitle}>{getCityConfigSync().appName}</Text>
          <Text style={mockupStyles.screenSubtitle}>Explore categories</Text>
          <View style={mockupStyles.categoryList}>
            {categoryIcons.slice(0, 5).map((cat, i) => (
              <View key={i} style={mockupStyles.categoryRow}>
                <Image source={cat.image} style={mockupStyles.categoryRowIcon} cachePolicy="memory-disk" />
                <View style={mockupStyles.categoryRowText}>
                  <Text style={mockupStyles.categoryRowName}>{cat.name}</Text>
                  <Text style={mockupStyles.categoryRowCount}>{onboardingCategoryTopicCounts[i]} topics</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
              </View>
            ))}
          </View>
        </PhoneMockup>
      </View>
    );
  }

  if (index === 3) {
    return (
      <View style={slideStyles.visualContainer}>
        <View style={mockupStyles.dualPhoneRow}>
          <View style={mockupStyles.dualPhoneWrapper}>
            <PhoneMockup>
              <View style={mockupStyles.customHeader}>
                <Ionicons name="arrow-back" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={mockupStyles.customLabel}>CUSTOM PODCAST</Text>
              </View>
              <Text style={mockupStyles.customTitle}>Your subject</Text>
              <Text style={mockupStyles.customSubtitle}>What {getCityConfigSync().name} story would you like?</Text>
              <View style={mockupStyles.textareaBox}>
                <Text style={mockupStyles.textareaText}>{onboardingCustomSubjectExample}</Text>
              </View>
              <View style={mockupStyles.continueBtn}>
                <Text style={mockupStyles.continueBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={12} color="#FFF" />
              </View>
            </PhoneMockup>
          </View>
          <View style={mockupStyles.dualPhoneWrapper}>
            <PhoneMockup>
              <View style={mockupStyles.customHeader}>
                <Ionicons name="arrow-back" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={mockupStyles.customLabel}>CUSTOM PODCAST</Text>
              </View>
              <Text style={mockupStyles.customTitle}>Choose your angle</Text>
              <Text style={mockupStyles.customSubtitle}>How should we tell the story?</Text>
              {["Historical", "Modern Culture", "Personal Stories"].map((angle, i) => (
                <View key={i} style={[mockupStyles.angleRow, i === 0 && mockupStyles.angleRowSelected]}>
                  <Text style={mockupStyles.angleName}>{angle}</Text>
                </View>
              ))}
            </PhoneMockup>
          </View>
        </View>
      </View>
    );
  }

  return null;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register, isLoading, resetPassword } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const topPadding = Platform.OS === "web" ? 20 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleSubmit = async () => {
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (mode === "register" && !firstName.trim()) {
      setError("Please enter your first name");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = mode === "login"
        ? await login(email.trim(), password)
        : await register(email.trim(), password, firstName.trim());

      if (!result.success) {
        setError(result.error || "Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email address first");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    const result = await resetPassword(email.trim());
    setIsSubmitting(false);
    if (result.success) {
      setResetSent(true);
    } else {
      setError(result.error || "Failed to send reset email");
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
    setResetSent(false);
  };

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
    return (
      <View style={[slideStyles.slide, { width: SCREEN_WIDTH }]}>
        <ScrollView
          contentContainerStyle={[
            slideStyles.slideScrollContent,
            { paddingTop: topPadding + 20, paddingBottom: bottomPadding + 60 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <View style={slideStyles.textSection}>
              <Text style={slideStyles.slideTitle}>{item.title}</Text>
              <Text style={slideStyles.slideSubtitle}>{item.subtitle}</Text>
            </View>

            <SlideContent slide={item} index={index} />

            {index === 0 && (
              <View style={formStyles.formContainer}>
                {mode === "register" && (
                  <View style={formStyles.inputWrapper}>
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color="rgba(255,255,255,0.4)"
                      style={formStyles.inputIcon}
                    />
                    <TextInput
                      style={formStyles.input}
                      placeholder="First name"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      autoComplete="given-name"
                    />
                  </View>
                )}

                <View style={formStyles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                    style={formStyles.inputIcon}
                  />
                  <TextInput
                    style={formStyles.input}
                    placeholder="Email"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                  />
                </View>

                <View style={formStyles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                    style={formStyles.inputIcon}
                  />
                  <TextInput
                    style={[formStyles.input, formStyles.passwordInput]}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    textContentType={mode === "register" ? "newPassword" : "password"}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={formStyles.eyeButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="rgba(255,255,255,0.4)"
                    />
                  </Pressable>
                </View>

                {error && (
                  <View style={formStyles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
                    <Text style={formStyles.errorText}>{error}</Text>
                  </View>
                )}

                {resetSent && (
                  <View style={formStyles.successContainer}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={formStyles.successText}>Password reset email sent. Check your inbox.</Text>
                  </View>
                )}

                <Pressable
                  style={({ pressed }) => [
                    formStyles.submitButton,
                    pressed && formStyles.submitButtonPressed,
                    (isSubmitting || isLoading) && formStyles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={formStyles.submitButtonText}>
                      {mode === "login" ? "Sign in" : "Create account"}
                    </Text>
                  )}
                </Pressable>

                {mode === "login" && (
                  <Pressable onPress={handleForgotPassword} style={formStyles.forgotContainer} disabled={isSubmitting}>
                    <Text style={formStyles.forgotText}>Forgot password?</Text>
                  </Pressable>
                )}

                <Pressable onPress={toggleMode} style={formStyles.toggleContainer}>
                  <Text style={formStyles.toggleText}>
                    {mode === "login"
                      ? "Don't have an account? "
                      : "Already have an account? "}
                    <Text style={formStyles.toggleLink}>
                      {mode === "login" ? "Sign up" : "Sign in"}
                    </Text>
                  </Text>
                </Pressable>

                {mode === "register" && (
                  <Pressable
                    onPress={() => Linking.openURL(`${getApiUrl()}/privacy-policy`)}
                    style={formStyles.privacyContainer}
                  >
                    <Text style={formStyles.privacyText}>
                      By creating an account, you agree to our{" "}
                      <Text style={formStyles.privacyLink}>Privacy Policy</Text>
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {index > 0 && (
              <Pressable
                style={({ pressed }) => [
                  formStyles.ctaButton,
                  pressed && formStyles.submitButtonPressed,
                ]}
                onPress={() => goToSlide(0)}
              >
                <Text style={formStyles.submitButtonText}>Get started</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0B1628", "#162033", "#0B1628"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollBeginDrag={() => Keyboard.dismiss()}
          keyboardShouldPersistTaps="handled"
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
      </KeyboardAvoidingView>

      <View style={[styles.pagination, { bottom: bottomPadding }]}>
        {slides.map((_, i) => (
          <Pressable key={i} onPress={() => goToSlide(i)} hitSlop={8}>
            <View
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1628",
  },
  pagination: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    borderRadius: 6,
  },
  dotActive: {
    width: 28,
    height: 6,
    backgroundColor: "#C4A265",
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
});

const slideStyles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  slideScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },
  textSection: {
    marginBottom: 28,
  },
  slideTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 38,
    color: "#FFFFFF",
    letterSpacing: -1,
    lineHeight: 44,
    marginBottom: 14,
  },
  slideSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.55)",
    lineHeight: 24,
    maxWidth: 320,
  },
  visualContainer: {
    marginBottom: 28,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  iconGridItem: {
    alignItems: "center",
    width: 90,
    gap: 6,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  iconLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
  featureList: {
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(196, 162, 101, 0.15)",
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(196, 162, 101, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    flex: 1,
  },
});

const mockupStyles = StyleSheet.create({
  phoneFrame: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    overflow: "hidden",
    paddingBottom: 12,
  },
  phoneNotch: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  phoneTime: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
  },
  phoneNotchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  phoneContent: {
    paddingHorizontal: 14,
    gap: 6,
  },
  screenTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  screenSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 8,
  },
  podcastItem: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  podcastCategory: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  podcastTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  podcastMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  podcastMetaText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
  },
  podcastMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  categoryList: {
    gap: 4,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 10,
    padding: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  categoryRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  categoryRowText: {
    flex: 1,
  },
  categoryRowName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  categoryRowCount: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
  },
  dualPhoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  dualPhoneWrapper: {
    flex: 1,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  customLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 9,
    color: "#C4A265",
    letterSpacing: 0.5,
  },
  customTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
    marginBottom: 2,
  },
  customSubtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.4)",
    marginBottom: 8,
  },
  textareaBox: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    minHeight: 50,
    marginBottom: 8,
  },
  textareaText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    lineHeight: 15,
  },
  continueBtn: {
    backgroundColor: "#C4A265",
    borderRadius: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  continueBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
  },
  angleRow: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  angleRowSelected: {
    borderColor: "rgba(196, 162, 101, 0.4)",
    backgroundColor: "rgba(196, 162, 101, 0.08)",
  },
  angleName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: "#FFFFFF",
  },
});

const formStyles = StyleSheet.create({
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputIcon: {
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 12,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: "#FFFFFF",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 14,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  errorText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: Colors.light.error,
    flex: 1,
  },
  submitButton: {
    backgroundColor: "#C4A265",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  toggleContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  toggleText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  toggleLink: {
    color: "#C4A265",
    fontFamily: "DMSans_600SemiBold",
  },
  ctaButton: {
    backgroundColor: "#C4A265",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  forgotContainer: {
    alignItems: "center",
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  successText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: "#4CAF50",
    flex: 1,
  },
  privacyContainer: {
    alignItems: "center",
    paddingVertical: 4,
  },
  privacyText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.35)",
    textAlign: "center",
    lineHeight: 18,
  },
  privacyLink: {
    color: "rgba(255, 255, 255, 0.55)",
    textDecorationLine: "underline" as const,
  },
});
