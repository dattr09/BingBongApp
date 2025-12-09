import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeSafe } from "../../utils/themeHelper";
import { badgeTierToColor } from "../../utils/badgeHelper";
import UserBadge from "../UserBadge";

export default function BadgeTab({ displayedUser }) {
  const { colors } = useThemeSafe();
  // Get badges from badgeInventory
  const badges = useMemo(() => {
    return (displayedUser?.badgeInventory || [])
      .filter((item) => item.badgeId)
      .map((item) => ({
        ...item.badgeId,
        earnedAt: item.earnedAt,
        isEquipped: item.isEquipped,
        _id: item.badgeId._id,
      }));
  }, [displayedUser?.badgeInventory]);

  const equippedBadge = useMemo(() => {
    return badges.find((b) => b.isEquipped);
  }, [badges]);

  // Group badges by tier
  const badgesByTier = useMemo(() => {
    const grouped = {
      Challenger: [],
      Grandmaster: [],
      Master: [],
      Diamond: [],
      Platinum: [],
      Gold: [],
      Silver: [],
      Bronze: [],
    };

    badges.forEach((badge) => {
      if (grouped[badge.tier]) {
        grouped[badge.tier].push(badge);
      }
    });

    return grouped;
  }, [badges]);

  if (badges.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20" style={{ backgroundColor: colors.background }}>
        <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: colors.warning + '20' }}>
          <Ionicons name="trophy-outline" size={48} color={colors.warning} />
        </View>
        <Text className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
          No badges yet
        </Text>
        <Text className="text-center" style={{ color: colors.textSecondary }}>
          Complete challenges to earn badges
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="p-2 rounded-lg" style={{ backgroundColor: colors.warning + '20' }}>
              <Ionicons name="trophy" size={24} color={colors.warning} />
            </View>
            <View>
              <Text className="text-xl font-semibold" style={{ color: colors.text }}>Badges</Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {badges.length} badges
              </Text>
            </View>
          </View>
          {equippedBadge && (
            <View
              className="px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: badgeTierToColor(equippedBadge.tier) + "20",
              }}
            >
              <Text
                className="text-sm font-medium"
                style={{ color: badgeTierToColor(equippedBadge.tier) }}
              >
                Equipped: {equippedBadge.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View className="p-4 gap-6">
        {Object.entries(badgesByTier).map(
          ([tier, tierBadges]) =>
            tierBadges.length > 0 && (
              <View key={tier}>
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons
                    name="star"
                    size={20}
                    color={badgeTierToColor(tier)}
                  />
                  <Text
                    className="text-lg font-semibold"
                    style={{ color: badgeTierToColor(tier) }}
                  >
                    {tier}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>({tierBadges.length})</Text>
                </View>
                <View className="flex-row flex-wrap gap-4">
                  {tierBadges.map((badge) => (
                    <View
                      key={badge._id}
                      className="relative p-4 rounded-lg border-2"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: badge.isEquipped
                          ? badgeTierToColor(badge.tier)
                          : "transparent",
                      }}
                    >
                      {badge.isEquipped && (
                        <View
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
                          style={{ backgroundColor: badgeTierToColor(badge.tier) }}
                        >
                          <Ionicons name="checkmark" size={16} color="white" />
                        </View>
                      )}
                      <UserBadge badge={badge} mode="large" />
                    </View>
                  ))}
                </View>
              </View>
            )
        )}
      </View>
    </ScrollView>
  );
}

