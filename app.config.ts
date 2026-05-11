import { ExpoConfig, ConfigContext } from "expo/config";

/**
 * City Stories — unified multi-city app identity.
 *
 * Bundle ID, app name, scheme and icon are all single values now. The app
 * supports multiple cities at runtime via the CityConfigContext; the bundled
 * cities are configured in constants/cityRegistry.ts.
 *
 * EAS project ID, Firebase config and API domain remain env-driven so we can
 * point at staging/prod variants.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const appName = "City Stories";
  const appSlug = "city-stories";
  const bundleId = "nl.greenhome.citystories";
  const scheme = "citystories";
  const androidPackage = "nl.greenhome.citystories";

  const apiDomain = process.env.EXPO_PUBLIC_API_DOMAIN || config.extra?.apiDomain || "paris-stories.replit.app";
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;

  return {
    ...config,
    name: appName,
    slug: appSlug,
    version: config.version || "1.0.0",
    runtimeVersion: "exposdk:54.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
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
      apiDomain,
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || config.extra?.firebaseApiKey || "",
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || config.extra?.firebaseProjectId || "",
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || config.extra?.firebaseAppId || "",
    },
  };
};
