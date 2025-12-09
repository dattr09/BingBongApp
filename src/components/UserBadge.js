import React from "react";
import { View, Text } from "react-native";
import { badgeTierToColor } from "../utils/badgeHelper";

// Helper function to get contrast color (white or black)
const getContrastColor = (hexColor) => {
  // Remove # if present
  const color = hexColor.replace("#", "");
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export default function UserBadge({ badge, mode = "mini" }) {
  // Không hiển thị nếu không có badge hoặc thiếu thông tin quan trọng
  if (!badge || !badge.name || !badge.tier) return null;

  const bgColor = badgeTierToColor(badge.tier);
  const textColor = getContrastColor(bgColor);
  const isLarge = mode === "large";

  return (
    <View
      className={`flex-row items-center gap-2 border font-semibold ${
        isLarge ? "px-3 py-2 rounded-lg" : "px-2 py-1 rounded-md"
      }`}
      style={{
        backgroundColor: bgColor,
        borderColor: bgColor,
      }}
    >
      {/* Tier circle */}
      <View
        className={`items-center justify-center font-bold rounded-full ${
          isLarge ? "w-5 h-5" : "w-3 h-3"
        }`}
        style={{ backgroundColor: textColor }}
      >
        <Text
          className={isLarge ? "text-[11px]" : "text-[8px]"}
          style={{ color: bgColor }}
        >
          {badge.tier?.[0] || "?"}
        </Text>
      </View>

      {/* Badge name */}
      <Text
        className={isLarge ? "text-sm" : "text-[11px]"}
        style={{ color: textColor }}
      >
        {badge.name || "Unknown Badge"}
      </Text>
    </View>
  );
}

