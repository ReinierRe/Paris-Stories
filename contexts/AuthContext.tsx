import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

const AUTH_TOKEN_KEY = "@paris_stories_auth_token";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  profileImageUrl?: string;
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

  const verifyToken = useCallback(async (authToken: string): Promise<boolean> => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/me", baseUrl);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(authToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (stored) {
          const valid = await verifyToken(stored);
          if (!valid) {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          }
        }
      } catch {}
      setIsLoading(false);
    })();
  }, [verifyToken]);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (!url.includes("auth")) return;

      const parsed = Linking.parse(url);
      const params = parsed.queryParams || {};

      if (params.token && typeof params.token === "string") {
        let userData: AuthUser | null = null;
        if (params.user && typeof params.user === "string") {
          try {
            userData = JSON.parse(decodeURIComponent(params.user));
          } catch {}
        }

        await AsyncStorage.setItem(AUTH_TOKEN_KEY, params.token);
        setToken(params.token);
        if (userData) {
          setUser(userData);
        } else {
          await verifyToken(params.token);
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, [verifyToken]);

  const login = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const startUrl = new URL("/api/auth/google/start", baseUrl);
      const startRes = await fetch(startUrl.toString());
      const { authUrl } = await startRes.json();

      if (Platform.OS === "web") {
        const result = await WebBrowser.openAuthSessionAsync(authUrl, Linking.createURL("auth"));
        if (result.type === "success" && result.url) {
          const parsed = Linking.parse(result.url);
          const params = parsed.queryParams || {};
          if (params.token && typeof params.token === "string") {
            let userData: AuthUser | null = null;
            if (params.user && typeof params.user === "string") {
              try {
                userData = JSON.parse(decodeURIComponent(params.user));
              } catch {}
            }
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, params.token);
            setToken(params.token);
            if (userData) {
              setUser(userData);
            } else {
              await verifyToken(params.token);
            }
          }
        }
      } else {
        await WebBrowser.openAuthSessionAsync(authUrl, "myapp://auth");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  }, [verifyToken]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        const baseUrl = getApiUrl();
        const url = new URL("/api/auth/logout", baseUrl);
        await fetch(url.toString(), {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      setUser(null);
      setToken(null);
    } catch {}
  }, [token]);

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
