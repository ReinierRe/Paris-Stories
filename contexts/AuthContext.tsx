import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

WebBrowser.maybeCompleteAuthSession();

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

const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const REDIRECT_URI = "https://auth.expo.io/@anonymous/paris-stories";

function parseHashParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return params;
  const hash = url.substring(hashIndex + 1);
  const pairs = hash.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
}

function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const qIndex = url.indexOf("?");
  if (qIndex === -1) return params;
  const hashIndex = url.indexOf("#");
  const query = hashIndex === -1 ? url.substring(qIndex + 1) : url.substring(qIndex + 1, hashIndex);
  const pairs = query.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  const exchangeAccessToken = useCallback(async (googleAccessToken: string) => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/google", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: googleAccessToken }),
      });

      if (res.ok) {
        const data = await res.json();
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        console.error("Auth exchange failed:", await res.text());
      }
    } catch (err) {
      console.error("Auth exchange error:", err);
    }
  }, []);

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

  const login = useCallback(async () => {
    try {
      const state = Crypto.randomUUID();
      const nonce = Crypto.randomUUID();

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: "token",
        scope: "openid profile email",
        state,
        nonce,
        prompt: "select_account",
      });

      const authUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        REDIRECT_URI,
      );

      if (result.type === "success" && result.url) {
        const hashParams = parseHashParams(result.url);
        const queryParams = parseQueryParams(result.url);

        const accessToken = hashParams.access_token || queryParams.access_token;

        if (accessToken) {
          await exchangeAccessToken(accessToken);
        } else {
          console.error("No access token in response:", result.url);
        }
      } else if (result.type === "cancel") {
        console.log("Auth cancelled by user");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  }, [clientId, exchangeAccessToken]);

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
