import React, { useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";

type Step = "email" | "code";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 20;

  const handleRequestReset = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/forgot-password", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("If an account exists with this email, a reset code has been sent.");
        setStep("code");
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!code.trim()) {
      setError("Please enter the 6-digit code from your email");
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/reset-password", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Password reset successfully! You can now sign in.");
        setTimeout(() => router.back(), 2000);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1A1F36", "#2A2F4A", "#1A1F36"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: topPadding + 20, paddingBottom: bottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="key-outline" size={40} color={Colors.light.accent} />
            </View>
            <Text style={styles.title}>
              {step === "email" ? "Reset Password" : "Enter Code"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "email"
                ? "Enter your email and we'll send you a reset code"
                : "Enter the 6-digit code from your email and your new password"}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {step === "email" ? (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
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
              </>
            ) : (
              <>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="keypad-outline"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="rgba(255,255,255,0.4)"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="New password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="newPassword"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="rgba(255,255,255,0.4)"
                    />
                  </Pressable>
                </View>
              </>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.light.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.submitButtonPressed,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={step === "email" ? handleRequestReset : handleResetPassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {step === "email" ? "Send Reset Code" : "Reset Password"}
                </Text>
              )}
            </Pressable>

            {step === "code" && (
              <Pressable onPress={handleRequestReset} style={styles.resendContainer}>
                <Text style={styles.resendText}>
                  Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1F36",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(200, 162, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 26,
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.55)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    gap: 14,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 12,
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
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  successText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: "#4ADE80",
    flex: 1,
  },
  submitButton: {
    backgroundColor: Colors.light.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 6,
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
  resendContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  resendText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  resendLink: {
    color: Colors.light.accent,
    fontFamily: "DMSans_600SemiBold",
  },
});
