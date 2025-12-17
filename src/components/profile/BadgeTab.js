import React, { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeSafe } from "../../utils/themeHelper";
import { badgeTierToColor } from "../../utils/badgeHelper";
import UserBadge from "../UserBadge";

export default function BadgeTab({ displayedUser, mode = "large" }) {
  const { colors } = useThemeSafe();
  const [searchQuery, setSearchQuery] = useState("");
  const badges = useMemo(() => {
    return (displayedUser?.badgeInventory || [])
      .filter((item) => item.badgeId)
      .map((item, index) => ({
        ...item.badgeId,
        earnedAt: item.earnedAt,
        isEquipped: item.isEquipped,
        _id: item.badgeId?._id || item.badgeId?.id || `badge-${index}`,
      }));
  }, [displayedUser?.badgeInventory]);

  const filteredBadges = useMemo(() => {
    if (!searchQuery.trim()) return badges;

    const query = searchQuery.toLowerCase();
    return badges.filter(
      (badge) =>
        badge.name?.toLowerCase().includes(query) ||
        badge.tier?.toLowerCase().includes(query) ||
        badge.description?.toLowerCase().includes(query)
    );
  }, [badges, searchQuery]);

  const equippedBadge = useMemo(() => {
    return badges.find((b) => b.isEquipped);
  }, [badges]);

  const tierStats = useMemo(() => {
    return {
      Challenger: badges.filter((b) => b.tier === "Challenger").length,
      Grandmaster: badges.filter((b) => b.tier === "Grandmaster").length,
      Master: badges.filter((b) => b.tier === "Master").length,
      Diamond: badges.filter((b) => b.tier === "Diamond").length,
      Platinum: badges.filter((b) => b.tier === "Platinum").length,
      Gold: badges.filter((b) => b.tier === "Gold").length,
      Silver: badges.filter((b) => b.tier === "Silver").length,
      Bronze: badges.filter((b) => b.tier === "Bronze").length,
    };
  }, [badges]);

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

    filteredBadges.forEach((badge) => {
      if (grouped[badge.tier]) {
        grouped[badge.tier].push(badge);
      }
    });

    return grouped;
  }, [filteredBadges]);

  const equippedBadges = useMemo(() => {
    return filteredBadges.filter(b => b.isEquipped);
  }, [filteredBadges]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const getTierIcon = (tier) => {
    switch (tier) {
      case "Challenger":
        return "flame";
      case "Grandmaster":
        return "diamond";
      case "Master":
        return "flash";
      case "Diamond":
        return "diamond";
      case "Platinum":
        return "sparkles";
      case "Gold":
        return "trophy";
      case "Silver":
        return "star";
      case "Bronze":
        return "shield";
      default:
        return "trophy";
    }
  };

  const EmptyState = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 16 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.warning + "20", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Ionicons name="trophy-outline" size={48} color={colors.warning} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
        No badges yet
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", maxWidth: 300 }}>
        Complete challenges and milestones to earn badges and show off your achievements!
      </Text>
    </View>
  );

  const NoResults = () => (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 64, paddingHorizontal: 16 }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
        No results found
      </Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", maxWidth: 300 }}>
        No badges found matching "{searchQuery}"
      </Text>
    </View>
  );

  const TierStat = ({ tier, count, iconName }) => {
    const bgColor = badgeTierToColor(tier);
    return (
      <View
        style={{
          borderRadius: 12,
          padding: 12,
          backgroundColor: bgColor,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          minHeight: 80,
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Ionicons name={iconName} size={16} color="#fff" />
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>{count}</Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: "500", color: "#fff", opacity: 0.9 }}>{tier}</Text>
      </View>
    );
  };

  const BadgeTierSection = ({ tier, tierBadges }) => {
    const tierColor = badgeTierToColor(tier);
    const iconName = getTierIcon(tier);

    return (
      <View style={{ marginBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Ionicons name={iconName} size={20} color={tierColor} />
          <Text style={{ fontSize: 18, fontWeight: "600", color: tierColor }}>
            {tier}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            ({tierBadges.length})
          </Text>
        </View>

        {/* Badges Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {tierBadges.map((badge, index) => {
            const badgeTierColor = badgeTierToColor(badge.tier);
            const isEquipped = badge.isEquipped;
            return (
              <View
                key={badge._id || `badge-${tier}-${index}`}
                style={{
                  position: "relative",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: isEquipped ? 3 : 1,
                  borderColor: isEquipped ? badgeTierColor : colors.border,
                  shadowColor: isEquipped ? badgeTierColor : "#000",
                  shadowOffset: { width: 0, height: isEquipped ? 4 : 2 },
                  shadowOpacity: isEquipped ? 0.4 : 0.1,
                  shadowRadius: isEquipped ? 8 : 4,
                  elevation: isEquipped ? 8 : 2,
                }}
              >
                {/* Equipped Badge Indicator */}
                {isEquipped && (
                  <View
                    style={{
                      position: "absolute",
                      top: -10,
                      right: -10,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: badgeTierColor,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      elevation: 5,
                    }}
                  >
                    <Ionicons name="star" size={14} color="#fff" />
                  </View>
                )}

                {/* Owned Badge Indicator - Small checkmark for all owned badges */}
                {!isEquipped && (
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.success + "40",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  </View>
                )}

                <UserBadge badge={badge} mode={mode} />

                {/* Badge Name */}
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isEquipped ? "600" : "500",
                    color: isEquipped ? badgeTierColor : colors.text,
                    marginTop: 8,
                    textAlign: "center",
                    maxWidth: 100,
                  }}
                  numberOfLines={2}
                >
                  {badge.name}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (badges.length === 0) {
    return <EmptyState />;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ padding: 8, borderRadius: 10, backgroundColor: colors.warning + "20" }}>
              <Ionicons name="trophy" size={24} color={colors.warning} />
            </View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text }}>
                Badges
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {badges.length} {badges.length === 1 ? "badge" : "badges"} earned
              </Text>
            </View>
          </View>

          {equippedBadge && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: badgeTierToColor(equippedBadge.tier),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="star" size={16} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>
                Equipped: {equippedBadge.name}
              </Text>
            </View>
          )}
        </View>

        {/* Top Tier Stats (Top 4) */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <View key="challenger" style={{ flex: 1, minWidth: "45%" }}>
            <TierStat tier="Challenger" count={tierStats.Challenger} iconName="flame" />
          </View>
          <View key="grandmaster" style={{ flex: 1, minWidth: "45%" }}>
            <TierStat tier="Grandmaster" count={tierStats.Grandmaster} iconName="diamond" />
          </View>
          <View key="master" style={{ flex: 1, minWidth: "45%" }}>
            <TierStat tier="Master" count={tierStats.Master} iconName="flash" />
          </View>
          <View key="diamond" style={{ flex: 1, minWidth: "45%" }}>
            <TierStat tier="Diamond" count={tierStats.Diamond} iconName="diamond" />
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ position: "relative" }}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textTertiary}
            style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}
          />
          <TextInput
            placeholder="Search badges..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              width: "100%",
              paddingLeft: 40,
              paddingRight: searchQuery ? 40 : 16,
              paddingVertical: 12,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              fontSize: 15,
              color: colors.text,
            }}
          />
          {searchQuery && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={{ position: "absolute", right: 12, top: 12, padding: 4 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>
        {filteredBadges.length === 0 ? (
          <NoResults />
        ) : (
          <View style={{ gap: 24 }}>
            {equippedBadges.length > 0 && (
              <View style={{ marginBottom: 8, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: colors.border }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Ionicons name="star" size={20} color={badgeTierToColor(equippedBadge?.tier || "Gold")} />
                  <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
                    Currently Equipped Badge
                  </Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                  {equippedBadges.map((badge, index) => {
                    const badgeTierColor = badgeTierToColor(badge.tier);
                    return (
                      <View
                        key={badge._id || `equipped-badge-${index}`}
                        style={{
                          position: "relative",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 16,
                          backgroundColor: colors.surface,
                          borderRadius: 12,
                          borderWidth: 3,
                          borderColor: badgeTierColor,
                          shadowColor: badgeTierColor,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.4,
                          shadowRadius: 8,
                          elevation: 8,
                        }}
                      >
                        <View
                          style={{
                            position: "absolute",
                            top: -10,
                            right: -10,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: badgeTierColor,
                            alignItems: "center",
                            justifyContent: "center",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 5,
                          }}
                        >
                          <Ionicons name="star" size={14} color="#fff" />
                        </View>

                        <UserBadge badge={badge} mode={mode} />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: badgeTierColor,
                            marginTop: 8,
                            textAlign: "center",
                            maxWidth: 100,
                          }}
                          numberOfLines={2}
                        >
                          {badge.name}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Ionicons name="trophy" size={20} color={colors.warning} />
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
                  All Owned Badges
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  ({badges.length} {badges.length === 1 ? "badge" : "badges"})
                </Text>
              </View>
              {Object.entries(badgesByTier)
                .filter(([tier, tierBadges]) => tierBadges.length > 0)
                .map(([tier, tierBadges]) => (
                  <BadgeTierSection key={tier} tier={tier} tierBadges={tierBadges} />
                ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

