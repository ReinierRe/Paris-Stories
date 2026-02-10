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

function base64URLEncode(buffer: Uint8Array): string {
  let str = "";
  for (let i = 0; i < buffer.length; i++) {
    str += String.fromCharCode(buffer[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateCodeVerifier(): Promise<string> {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return base64URLEncode(bytes);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );
  return digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  const qIndex = url.indexOf("?");
  if (qIndex === -1) return params;

  const hashIndex = url.indexOf("#");
  const queryString = hashIndex === -1 ? url.substring(qIndex + 1) : url.substring(qIndex + 1, hashIndex);

  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex !== -1) {
      const key = decodeURIComponent(pair.substring(0, eqIndex));
      const value = decodeURIComponent(pair.substring(eqIndex + 1));
      params[key] = value;
    }
  }
  return params;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  const exchangeCodeForToken = useCallback(async (code: string, codeVerifier: string) => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/google", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          codeVerifier,
          redirectUri: REDIRECT_URI,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        const errText = await res.text();
        console.error("Auth exchange failed:", errText);
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
      const codeVerifier = await generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid profile email",
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        access_type: "offline",
        prompt: "select_account",
      });

      const authUrl = `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        REDIRECT_URI,
      );

      if (result.type === "success" && result.url) {
        const urlParams = parseUrlParams(result.url);
        const code = urlParams.code;

        if (code) {
          await exchangeCodeForToken(code, codeVerifier);
        } else {
          console.error("No authorization code in response:", result.url);
        }
      } else if (result.type === "cancel") {
        console.log("Auth cancelled by user");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  }, [clientId, exchangeCodeForToken]);

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
