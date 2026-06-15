import React, { createContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { logout as apiLogout } from "../services/api";

type AuthContextType = {
  token: string | null;
  signIn: (token: string, user: any) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userToken = await AsyncStorage.getItem("token");
        setToken(userToken);
      } catch (e) {
        console.log("Restoring token failed", e);
      }
      setIsLoading(false);
    };

    bootstrapAsync();
  }, []);

  const signIn = async (newToken: string, user: any) => {
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    setToken(newToken);
  };

  const signOut = async () => {
    await apiLogout();
    setToken(null);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ token, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
