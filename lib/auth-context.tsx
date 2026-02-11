import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

/**
 * AuthContext - 全局認證狀態管理
 * 支援 email/password 登入、註冊、登出
 * 使用 AsyncStorage 持久化用戶資訊
 */

export interface AuthUser {
  id: number;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  isVVIP?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface SignupData {
  email: string;
  password: string;
  displayName: string;
  birthDate?: string;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  musicGenres?: string[];
}

const AUTH_STORAGE_KEY = "soundcheck_auth_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = trpc.auth.signup.useMutation();
  const loginApiMutation = trpc.auth.login.useMutation();

  // 從本地存儲恢復用戶
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
        }
      } catch (err) {
        console.error("[AuthContext] Failed to restore user:", err);
      } finally {
        setIsLoading(false);
      }
    };
    restoreUser();
  }, []);

  // 持久化用戶資訊
  const persistUser = useCallback(async (userData: AuthUser | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (err) {
      console.error("[AuthContext] Failed to persist user:", err);
    }
  }, []);

  // 登入
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginApiMutation.mutateAsync({ email, password });
      const authUser: AuthUser = {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        avatarUrl: result.user.avatarUrl,
        isVVIP: result.user.isVVIP,
      };
      setUser(authUser);
      await persistUser(authUser);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || "登入失敗，請稍後重試";
      return { success: false, error: errorMessage };
    }
  }, [loginApiMutation, persistUser]);

  // 註冊
  const signup = useCallback(async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        birthDate: data.birthDate,
        gender: data.gender,
        location: data.location,
        musicGenres: data.musicGenres,
      });
      const authUser: AuthUser = {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        avatarUrl: result.user.avatarUrl,
      };
      setUser(authUser);
      await persistUser(authUser);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.message || "註冊失敗，請稍後重試";
      return { success: false, error: errorMessage };
    }
  }, [loginMutation, persistUser]);

  // 登出
  const logout = useCallback(async () => {
    try {
      // Call server logout (clears cookie)
      // We use a try-catch since the user might not have a valid session
      try {
        // trpc logout would be called here if needed
      } catch {}
      setUser(null);
      await persistUser(null);
    } catch (err) {
      console.error("[AuthContext] Logout error:", err);
      setUser(null);
      await persistUser(null);
    }
  }, [persistUser]);

  // 刷新用戶資訊
  const refresh = useCallback(async () => {
    const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      signup,
      logout,
      refresh,
    }),
    [user, isAuthenticated, isLoading, login, signup, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
