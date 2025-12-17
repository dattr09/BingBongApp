import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

const THEME_STORAGE_KEY = "@app_theme";

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState("system");
  const [isDark, setIsDark] = useState(() => {
    return systemTheme === "dark";
  });

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error("Error loading theme:", error);
      }
    };
    loadTheme();
  }, []);

  useEffect(() => {
    if (theme === "system") {
      setIsDark(systemTheme === "dark");
    } else {
      setIsDark(theme === "dark");
    }
  }, [theme, systemTheme]);

  const toggleTheme = async () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const setThemeMode = async (mode) => {
    setTheme(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const colors = {
    light: {
      background: "#FFFFFF",
      surface: "#F8FAFC",
      primary: "#0EA5E9",
      secondary: "#38BDF8",
      text: "#111827",
      textSecondary: "#6B7280",
      textTertiary: "#9CA3AF",
      border: "#E5E7EB",
      borderLight: "#F3F4F6",
      error: "#EF4444",
      success: "#10B981",
      warning: "#F59E0B",
      card: "#FFFFFF",
      shadow: "rgba(0, 0, 0, 0.1)",
    },
    dark: {
      background: "#111827",
      surface: "#1F2937",
      primary: "#0EA5E9",
      secondary: "#38BDF8",
      text: "#F9FAFB",
      textSecondary: "#D1D5DB",
      textTertiary: "#9CA3AF",
      border: "#374151",
      borderLight: "#4B5563",
      error: "#EF4444",
      success: "#10B981",
      warning: "#F59E0B",
      card: "#1F2937",
      shadow: "rgba(0, 0, 0, 0.3)",
    },
  };

  const themeColors = colors[isDark ? "dark" : "light"] || colors.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        setThemeMode,
        colors: themeColors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
