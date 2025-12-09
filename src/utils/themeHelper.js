import { useTheme } from "../context/ThemeContext";

/**
 * Safe hook to use theme with fallback values
 * Use this in components that might render before ThemeProvider is ready
 */
export const useThemeSafe = () => {
  try {
    return useTheme();
  } catch {
    return {
      isDark: false,
      colors: {
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
      toggleTheme: () => {},
      setThemeMode: () => {},
    };
  }
};
