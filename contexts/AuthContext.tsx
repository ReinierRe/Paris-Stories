import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { getApiUrl, setOnUnauthorized } from "@/lib/query-client";

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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const verifyWithBackend = useCallback(async (idToken: string): Promise<AuthUser | null> => {
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
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const backendUser = await verifyWithBackend(idToken);
          if (backendUser) {
            setUser(backendUser);
            setToken(idToken);
          } else {
            setUser(null);
            setToken(null);
          }
        } catch {
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [verifyWithBackend]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();
      const backendUser = await verifyWithBackend(idToken);
      if (backendUser) {
        setUser(backendUser);
        setToken(idToken);
        return { success: true };
      }
      return { success: false, error: "Failed to verify with server" };
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
      const backendUser = await verifyWithBackend(idToken);
      if (backendUser) {
        setUser(backendUser);
        setToken(idToken);
        return { success: true };
      }
      return { success: false, error: "Failed to verify with server" };
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
    }),
    [user, token, isLoading, login, register, logout],
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
