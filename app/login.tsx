import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A1F36", "#2A2F4A", "#1A1F36"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={[styles.content, { paddingTop: topPadding + 60 }]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="microphone-variant"
            size={48}
            color={Colors.light.accent}
          />
        </View>

        <Text style={styles.title}>Paris Stories</Text>
        <Text style={styles.subtitle}>
          Discover the hidden stories of Paris through personalized podcasts
        </Text>

        <View style={styles.featureList}>
          <FeatureItem
            icon="library-outline"
            text="40 topics across 5 Parisian themes"
          />
          <FeatureItem
            icon="mic-outline"
            text="AI-generated audio narration"
          />
          <FeatureItem
            icon="language-outline"
            text="Available in English and Dutch"
          />
          <FeatureItem
            icon="musical-notes-outline"
            text="Choose voice, perspective & length"
          />
        </View>
      </View>

      <View
        style={[
          styles.bottom,
          { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed,
            (isLoggingIn || isLoading) && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={isLoggingIn || isLoading}
        >
          {isLoggingIn ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={22} color="#FFFFFF" />
              <Text style={styles.loginButtonText}>Sign in to get started</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          Sign in with your Google account via Replit
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons
        name={icon as any}
        size={20}
        color={Colors.light.accent}
      />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1F36",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "rgba(196, 162, 101, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(196, 162, 101, 0.2)",
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 48,
    maxWidth: 300,
  },
  featureList: {
    alignSelf: "stretch",
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingLeft: 8,
  },
  featureText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    flex: 1,
  },
  bottom: {
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  loginButton: {
    backgroundColor: Colors.light.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  loginButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 17,
    color: "#FFFFFF",
  },
  disclaimer: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    marginTop: 14,
  },
});
