import { ExpoConfig, ConfigContext } from "expo/config";

const CITY_CONFIGS: Record<string, { name: string; slug: string; bundleId: string; scheme: string; androidPackage: string }> = {
  paris: {
    name: "Paris Stories",
    slug: "paris-stories",
    bundleId: "app.replit.parisstories",
    scheme: "parisstories",
    androidPackage: "com.greenhome.parisstories",
  },
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const cityId = process.env.EXPO_PUBLIC_CITY_ID || "paris";
  const cityConfig = CITY_CONFIGS[cityId] || CITY_CONFIGS.paris;

  return {
    ...config,
    name: cityConfig.name,
    slug: cityConfig.slug,
    version: config.version || "1.0.4",
    runtimeVersion: "exposdk:54.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: cityConfig.scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0B1628",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: cityConfig.bundleId,
      associatedDomains: [
        `webcredentials:${cityConfig.slug}.replit.app`,
      ],
      infoPlist: {
        UIBackgroundModes: ["audio"],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: cityConfig.androidPackage,
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
      eas: { projectId: config.extra?.eas?.projectId || "68998269-2bf6-4afa-8d80-56df617ea768" },
      cityId,
      apiDomain: config.extra?.apiDomain || "paris-stories.replit.app",
      firebaseApiKey: config.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
      firebaseProjectId: config.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
      firebaseAppId: config.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
    },
  };
};
