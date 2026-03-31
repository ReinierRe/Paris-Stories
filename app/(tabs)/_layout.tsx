import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import Colors from "@/constants/colors";
import { useTranslation } from "@/i18n/useTranslation";
import MiniPlayer from "@/components/MiniPlayer";

let liquidGlassAvailable = false;
if (Platform.OS !== "web") {
  try {
    const { isLiquidGlassAvailable } = require("expo-glass-effect");
    liquidGlassAvailable = isLiquidGlassAvailable();
  } catch {}
}

let NativeTabs: any = null;
let Icon: any = null;
let Label: any = null;
if (liquidGlassAvailable) {
  try {
    const nativeTabsModule = require("expo-router/unstable-native-tabs");
    NativeTabs = nativeTabsModule.NativeTabs;
    Icon = nativeTabsModule.Icon;
    Label = nativeTabsModule.Label;
  } catch {}
}

function NativeTabLayout() {
  const { t } = useTranslation();
  if (!NativeTabs || !Icon || !Label) return <ClassicTabLayout />;
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person", selected: "person.fill" }} />
        <Label>{t("tabs.myProfile")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "books.vertical", selected: "books.vertical.fill" }} />
        <Label>{t("tabs.library")}</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="podcasts">
        <Icon sf={{ default: "headphones", selected: "headphones" }} />
        <Label>{t("tabs.myPodcasts")}</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.accent,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarLabelStyle: {
          fontFamily: "DMSans_500Medium",
          fontSize: 11,
        },
        tabBarStyle: {
          position: "absolute" as const,
          backgroundColor: isIOS ? "transparent" : isDark ? "#1A1F36" : "#FFFFFF",
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: Colors.light.divider,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: isDark ? "#1A1F36" : "#FFFFFF" },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.myProfile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.library"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="podcasts"
        options={{
          title: t("tabs.myPodcasts"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="headset-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabLayoutWithMiniPlayer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = Platform.OS === "web" ? 84 : (49 + insets.bottom);
  return (
    <View style={{ flex: 1 }}>
      {children}
      <View style={{ position: "absolute", left: 0, right: 0, bottom: tabBarHeight }}>
        <MiniPlayer />
      </View>
    </View>
  );
}

export default function TabLayout() {
  const layout = liquidGlassAvailable ? <NativeTabLayout /> : <ClassicTabLayout />;
  return <TabLayoutWithMiniPlayer>{layout}</TabLayoutWithMiniPlayer>;
}
