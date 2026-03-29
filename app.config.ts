import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const cityId = process.env.EXPO_PUBLIC_CITY_ID || "paris";
  const appName = process.env.EXPO_PUBLIC_APP_NAME || "Paris Stories";
  const appSlug = process.env.EXPO_PUBLIC_APP_SLUG || "paris-stories";
  const bundleId = process.env.EXPO_PUBLIC_BUNDLE_ID || "app.replit.parisstories";
  const scheme = process.env.EXPO_PUBLIC_SCHEME || "parisstories";
  const androidPackage = process.env.EXPO_PUBLIC_ANDROID_PACKAGE || "com.greenhome.parisstories";
  const apiDomain = process.env.EXPO_PUBLIC_API_DOMAIN || config.extra?.apiDomain || "paris-stories.replit.app";
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId || "68998269-2bf6-4afa-8d80-56df617ea768";

  const cityIcons: Record<string, string> = {
    paris: "./assets/images/icon.png",
    amsterdam: "./assets/images/icon-amsterdam.png",
  };

  const citySplashIcons: Record<string, string> = {
    paris: "./assets/images/splash-icon.png",
    amsterdam: "./assets/images/splash-icon-amsterdam.png",
  };

  return {
    ...config,
    name: appName,
    slug: appSlug,
    version: config.version || "1.0.4",
    runtimeVersion: "exposdk:54.0.0",
    orientation: "portrait",
    icon: cityIcons[cityId] || cityIcons.paris,
    scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: citySplashIcons[cityId] || citySplashIcons.paris,
      resizeMode: "contain",
      backgroundColor: "#0B1628",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: bundleId,
      associatedDomains: [
        `webcredentials:${appSlug}.replit.app`,
      ],
      infoPlist: {
        UIBackgroundModes: ["audio"],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: androidPackage,
      adaptiveIcon: {
        backgroundColor: "#0B1628",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
    },
    web: {
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      ["expo-router", { origin: "https://replit.com/" }],
      "expo-font",
      "expo-web-browser",
      "expo-localization",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: { origin: "https://replit.com/" },
      eas: { projectId: easProjectId },
      cityId,
      apiDomain,
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || config.extra?.firebaseApiKey || "",
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || config.extra?.firebaseProjectId || "",
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || config.extra?.firebaseAppId || "",
    },
  };
};
