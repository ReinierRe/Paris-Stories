import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || extra.firebaseApiKey,
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.firebaseProjectId}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || extra.firebaseProjectId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || extra.firebaseAppId,
};

const app = initializeApp(firebaseConfig);

// @ts-ignore - getReactNativePersistence is exported from firebase/auth RN bundle
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { app, auth };
