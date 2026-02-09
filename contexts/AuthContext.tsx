import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

WebBrowser.maybeCompleteAuthSession();

const AUTH_TOKEN_KEY = "@paris_stories_auth_token";

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

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

const isNative = Platform.OS !== "web";

const redirectUri = isNative
  ? "https://auth.expo.io/@anonymous/paris-stories"
  : makeRedirectUri();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      responseType: "code",
      usePKCE: true,
      redirectUri,
      scopes: ["openid", "profile", "email"],
    },
    discovery,
  );

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
    if (response?.type === "success") {
      const { code } = response.params;
      if (code) {
        (async () => {
          try {
            const baseUrl = getApiUrl();
            const url = new URL("/api/auth/google", baseUrl);
            const res = await fetch(url.toString(), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code,
                codeVerifier: request?.codeVerifier,
                redirectUri,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
              setToken(data.token);
              setUser(data.user);
            } else {
              const errData = await res.text();
              console.error("Auth exchange failed:", errData);
            }
          } catch (err) {
            console.error("Auth exchange error:", err);
          }
        })();
      }
    }
  }, [response]);

  const login = useCallback(async () => {
    try {
      await promptAsync(isNative ? { useProxy: true } as any : undefined);
    } catch (err) {
      console.error("Login error:", err);
    }
  }, [promptAsync]);

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
