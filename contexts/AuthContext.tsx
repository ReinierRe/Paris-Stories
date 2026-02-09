import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { getApiUrl } from "@/lib/query-client";

const AUTH_TOKEN_KEY = "@paris_stories_auth_token";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  username?: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async (authToken: string) => {
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
          const valid = await fetchUser(stored);
          if (!valid) {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          }
        }
      } catch {}
      setIsLoading(false);
    })();
  }, [fetchUser]);

  const login = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const loginUrl = new URL("/api/auth/login", baseUrl);

      if (Platform.OS === "web") {
        const width = 500;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          loginUrl.toString(),
          "replit-auth",
          `width=${width},height=${height},left=${left},top=${top}`,
        );

        await new Promise<void>((resolve) => {
          const handler = async (event: MessageEvent) => {
            if (event.data?.type === "AUTH_TOKEN" && event.data.token) {
              window.removeEventListener("message", handler);
              const authToken = event.data.token;
              await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
              await fetchUser(authToken);
              popup?.close();
              resolve();
            }
          };
          window.addEventListener("message", handler);

          const pollTimer = setInterval(() => {
            if (popup?.closed) {
              clearInterval(pollTimer);
              window.removeEventListener("message", handler);
              resolve();
            }
          }, 500);
        });
      } else {
        const scheme = "exp";
        const returnUrl = `${scheme}://`;
        loginUrl.searchParams.set("returnTo", returnUrl);

        const result = await WebBrowser.openAuthSessionAsync(
          loginUrl.toString(),
          returnUrl,
        );

        if (result.type === "success" && result.url) {
          const url = new URL(result.url);
          const authToken = url.searchParams.get("token");
          if (authToken) {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
            await fetchUser(authToken);
          }
        }
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  }, [fetchUser]);

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
