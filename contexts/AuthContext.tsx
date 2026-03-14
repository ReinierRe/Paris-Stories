import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onIdTokenChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getApiUrl, setOnUnauthorized } from "@/lib/query-client";

interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  preferredLanguage: string;
  preferredVoice: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePreferences: (prefs: { preferredLanguage?: string; preferredVoice?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function getFreshToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
  } catch {}
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyWithBackend = useCallback(async (idToken: string): Promise<{ user: AuthUser | null; error?: string }> => {
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/verify", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        const data = await res.json();
        return { user: data.user };
      }
      const errorText = await res.text().catch(() => "");
      return { user: null, error: `Server returned ${res.status}: ${errorText}` };
    } catch (err: any) {
      return { user: null, error: err?.message || "Network error" };
    }
  }, []);

  useEffect(() => {
    let initialLoad = true;
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          if (initialLoad) {
            const result = await verifyWithBackend(idToken);
            if (result.user) {
              setUser(result.user);
            } else {
              console.warn("Auth state verify failed:", result.error);
              setUser(null);
              setToken(null);
            }
          }
        } catch {
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      initialLoad = false;
      setIsLoading(false);
    });

    return unsubscribe;
  }, [verifyWithBackend]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const result = await verifyWithBackend(idToken);
      if (result.user) {
        setUser(result.user);
        setToken(idToken);
        return { success: true };
      }
      return { success: false, error: result.error || "Failed to verify with server" };
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        return { success: false, error: "Invalid email or password" };
      }
      if (code === "auth/too-many-requests") {
        return { success: false, error: "Too many attempts. Please try again later." };
      }
      return { success: false, error: err?.message || "Login failed" };
    }
  }, [verifyWithBackend]);

  const register = useCallback(async (email: string, password: string, firstName: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: firstName });
      const idToken = await credential.user.getIdToken();
      const result = await verifyWithBackend(idToken);
      if (result.user) {
        setUser(result.user);
        setToken(idToken);
        return { success: true };
      }
      return { success: false, error: result.error || "Failed to verify with server" };
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        return { success: false, error: "Email already registered" };
      }
      if (code === "auth/weak-password") {
        return { success: false, error: "Password must be at least 6 characters" };
      }
      return { success: false, error: err?.message || "Registration failed" };
    }
  }, [verifyWithBackend]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
    } catch {}
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const freshToken = await getFreshToken();
      if (!freshToken) return { success: false, error: "Not authenticated" };
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/account", baseUrl);
      const res = await fetch(url.toString(), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${freshToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || "Failed to delete account" };
      }
      await signOut(auth);
      setUser(null);
      setToken(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || "Failed to delete account" };
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: { preferredLanguage?: string; preferredVoice?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const freshToken = await getFreshToken();
      if (!freshToken) return { success: false, error: "Not authenticated" };

      const previousUser = user;
      setUser((prev) => prev ? { ...prev, ...prefs } : prev);

      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/preferences", baseUrl);
      const res = await fetch(url.toString(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        setUser(previousUser);
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || "Failed to update preferences" };
      }
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
      return { success: true };
    } catch (err: any) {
      setUser((prev) => prev ? { ...prev, preferredLanguage: user?.preferredLanguage, preferredVoice: user?.preferredVoice } : prev);
      return { success: false, error: err?.message || "Failed to update preferences" };
    }
  }, [user]);

  const resetPassword = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/user-not-found") {
        return { success: false, error: "No account found with this email" };
      }
      return { success: false, error: err?.message || "Failed to send reset email" };
    }
  }, []);

  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    setOnUnauthorized(() => {
      logoutRef.current();
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      register,
      logout,
      deleteAccount,
      resetPassword,
      updatePreferences,
    }),
    [user, token, isLoading, login, register, logout, deleteAccount, resetPassword, updatePreferences],
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
