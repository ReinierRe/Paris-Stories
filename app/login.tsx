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
  Image,
  Dimensions,
  FlatList,
  ViewToken,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Mode = "login" | "register";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  features?: { icon: string; text: string }[];
}

const slides: Slide[] = [
  {
    id: "welcome",
    title: "Discover the\nReal Paris",
    subtitle: "Tailored history, culture, and local tales — brought to life through immersive audio stories.",
  },
  {
    id: "audio-tours",
    title: "Immersive\nAudio Tours",
    subtitle: "Expertly crafted podcasts for museums, landmarks, and neighborhoods — available in multiple languages.",
    features: [
      { icon: "headset", text: "Professional narration" },
      { icon: "language", text: "Multiple languages" },
      { icon: "timer", text: "Short & long formats" },
    ],
  },
  {
    id: "real-paris",
    title: "Stories That\nCome Alive",
    subtitle: "Explore the French Revolution, hidden neighborhoods, iconic buildings, and centuries of fascinating history.",
    features: [
      { icon: "time", text: "Rich historical depth" },
      { icon: "map", text: "Neighborhood guides" },
      { icon: "restaurant", text: "Culinary traditions" },
    ],
  },
  {
    id: "custom",
    title: "Create Your\nOwn Adventure",
    subtitle: "Tell the AI your interests and get a personalized story — your own private Paris guide.",
    features: [
      { icon: "sparkles", text: "AI-powered stories" },
      { icon: "create", text: "Choose your angle" },
      { icon: "heart", text: "Save your favorites" },
    ],
  },
];

function SlideContent({ slide, index }: { slide: Slide; index: number }) {
  const categoryIcons = [
    { name: "History", image: require("@/assets/images/category-history.png") },
    { name: "Revolution", image: require("@/assets/images/category-french-revolution.png") },
    { name: "Museums", image: require("@/assets/images/category-museums.png") },
    { name: "Buildings", image: require("@/assets/images/category-epic-buildings.png") },
    { name: "Modern", image: require("@/assets/images/category-modern-history.png") },
    { name: "Culinary", image: require("@/assets/images/category-culinary.png") },
    { name: "Neighborhoods", image: require("@/assets/images/category-neighborhoods.png") },
  ];

  if (index === 0) {
    return (
      <View style={slideStyles.visualContainer}>
        <View style={slideStyles.iconGrid}>
          {categoryIcons.slice(0, 6).map((cat, i) => (
            <View key={i} style={slideStyles.iconGridItem}>
              <Image source={cat.image} style={slideStyles.categoryIcon} />
              <Text style={slideStyles.iconLabel}>{cat.name}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (slide.features) {
    return (
      <View style={slideStyles.visualContainer}>
        <View style={slideStyles.featureList}>
          {slide.features.map((feature, i) => (
            <View key={i} style={slideStyles.featureRow}>
              <View style={slideStyles.featureIconCircle}>
                <Ionicons name={feature.icon as any} size={22} color="#C4A265" />
              </View>
              <Text style={slideStyles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return null;
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, register, isLoading } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
  };

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
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
});
