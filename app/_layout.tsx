import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { PodcastProvider } from "@/contexts/PodcastContext";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CityConfigProvider, useCityConfig } from "@/contexts/CityConfigContext";
import LoginScreen from "@/app/login";
import { Asset } from "expo-asset";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import { Platform, ActivityIndicator, View } from "react-native";

const loginImages = [
  require("@/assets/images/category-history.png"),
  require("@/assets/images/category-french-revolution.png"),
  require("@/assets/images/category-museums.png"),
  require("@/assets/images/category-epic-buildings.png"),
  require("@/assets/images/category-epic-buildings-amsterdam.png"),
  require("@/assets/images/category-modern-history.png"),
  require("@/assets/images/category-culinary.png"),
  require("@/assets/images/category-neighborhoods.png"),
  require("@/assets/images/category-neighborhoods-amsterdam.png"),
];

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="customize"
        options={{
          presentation: Platform.OS === "web" ? "card" : "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="custom-create"
        options={{
          presentation: Platform.OS === "web" ? "card" : "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="city-picker"
        options={{
          presentation: Platform.OS === "web" ? "card" : "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="player"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

function AuthGate() {
  const { isAuthenticated, isLoading, isNewUser, clearNewUser } = useAuth();
  const { isFirstLaunch, isLoaded: cityLoaded, markFirstLaunchDone } = useCityConfig();
  const hasNavigatedNewUser = useRef(false);
  const hasNavigatedFirstLaunch = useRef(false);

  // New user (just registered): land on Profile so they see their level + city setup
  useEffect(() => {
    if (isAuthenticated && isNewUser && !hasNavigatedNewUser.current) {
      hasNavigatedNewUser.current = true;
      setTimeout(() => {
        router.replace("/(tabs)/profile");
        clearNewUser();
      }, 100);
    }
  }, [isAuthenticated, isNewUser, clearNewUser]);

  // First-launch existing user: also land on Profile (city manager) on first install of multi-city app
  useEffect(() => {
    if (
      isAuthenticated &&
      cityLoaded &&
      isFirstLaunch &&
      !isNewUser &&
      !hasNavigatedFirstLaunch.current
    ) {
      hasNavigatedFirstLaunch.current = true;
      setTimeout(() => {
        router.replace("/(tabs)/profile");
        markFirstLaunchDone();
      }, 100);
    }
  }, [isAuthenticated, cityLoaded, isFirstLaunch, isNewUser, markFirstLaunchDone]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1A1F36" }}>
        <ActivityIndicator size="large" color="#C4A265" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    Asset.loadAsync(loginImages).then(() => setImagesLoaded(true)).catch(() => setImagesLoaded(true));
  }, []);

  const assetsReady = (fontsLoaded || fontError) && imagesLoaded;

  useEffect(() => {
    if (assetsReady) {
      SplashScreen.hideAsync();
    }
  }, [assetsReady]);

  if (!assetsReady) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CityConfigProvider>
          <AuthProvider>
            <PodcastProvider>
              <AudioPlayerProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <AuthGate />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </AudioPlayerProvider>
            </PodcastProvider>
          </AuthProvider>
        </CityConfigProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
