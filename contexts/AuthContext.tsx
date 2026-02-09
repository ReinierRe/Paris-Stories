import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithCredential, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = "@paris_stories_auth_token";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const firebaseAuth = getAuth(app);

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    responseType: "id_token",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, idToken);
        setToken(idToken);
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          firstName: firebaseUser.displayName || undefined,
        });
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(firebaseAuth, credential).catch((err) => {
          console.error("Firebase sign-in error:", err);
        });
      }
    }
  }, [response]);

  const login = useCallback(async () => {
    try {
      await promptAsync();
    } catch (err) {
      console.error("Login error:", err);
    }
  }, [promptAsync]);

  const logout = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
