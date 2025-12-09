import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import {
  getAllBadges,
  getUserBadgeInventory,
  claimBadge,
  equipBadge,
  unequipBadge,
} from "../../services/badgeService";
import { getUserStats } from "../../services/statsService";
import { badgeTierToColor, computeBadgeProgress } from "../../utils/badgeHelper";

const TIERS = [
  "Challenger",
  "Grandmaster",
  "Master",
  "Diamond",
  "Platinum",
  "Gold",
  "Silver",
  "Bronze",
];

export default function BadgeScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [currentUser, setCurrentUser] = useState(null);
  const [badges, setBadges] = useState([]);
  const [userBadgeInventory, setUserBadgeInventory] = useState([]);
  const [equippedBadgeId, setEquippedBadgeId] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("my");
  const [completionFilter, setCompletionFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }

      const [badgesResult, inventoryResult, statsResult] = await Promise.all([
        getAllBadges(),
        getUserBadgeInventory(),
        getUserStats(),
      ]);

      if (badgesResult.success) {
        setBadges(badgesResult.data || []);
      }
      if (inventoryResult.success) {
        const inventory = inventoryResult.data || [];
        setUserBadgeInventory(inventory);
        const equipped = inventory.find((b) => b.isEquipped);
        if (equipped) {
          setEquippedBadgeId(equipped.badgeId?._id || equipped.badgeId);
        }
      }
      if (statsResult.success) {
        setUserStats(statsResult.data || {});
      }
    } catch (error) {
      console.error("Fetch Badge Data Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const ownedBadgeIds = new Set(
    userBadgeInventory.map(
      (item) => item.badgeId?._id || item.badgeId || item._id
    )
  );

  const unclaimedCompletedCount = badges.filter((badge) => {
    if (ownedBadgeIds.has(badge._id)) return false;
    const progress = computeBadgeProgress(badge, userStats || {});
    const percentage = Math.min(
      Math.round((progress.current / progress.target) * 100),
      100
    );
    return percentage >= 100;
  }).length;

  const handleClaimBadge = async (badge) => {
    try {
      const res = await claimBadge(badge._id);
      if (res.success) {
        Alert.alert("Success", "Badge claimed!");
        fetchData();
      } else {
        Alert.alert("Error", res.message || "Unable to claim badge");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while claiming badge");
    }
  };

  const handleEquipBadge = async (badgeId) => {
    try {
      const res = await equipBadge(badgeId);
      if (res.success) {
        setEquippedBadgeId(badgeId);
        fetchData();
      } else {
        Alert.alert("Error", res.message || "Unable to equip badge");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while equipping badge");
    }
  };

  const handleUnequipBadge = async (badgeId) => {
    try {
      const res = await unequipBadge(badgeId);
      if (res.success) {
        setEquippedBadgeId(null);
        fetchData();
      } else {
        Alert.alert("Error", res.message || "Unable to unequip badge");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while unequipping badge");
    }
  };

  const filteredBadges = badges.filter((badge) => {
    if (ownedBadgeIds.has(badge._id)) return false;
    const progress = computeBadgeProgress(badge, userStats || {});
    const percentage = Math.min(
      Math.round((progress.current / progress.target) * 100),
      100
    );

    if (completionFilter === "completed" && percentage < 100) return false;
    if (completionFilter === "not_completed" && percentage >= 100) return false;
    if (tierFilter !== "all" && badge.tier !== tierFilter) return false;

    return true;
  });

  const renderBadgeCard = (badge, isOwned = false, isEquipped = false) => {
    const progress = computeBadgeProgress(badge, userStats || {});
    const percentage = Math.min(
      Math.round((progress.current / progress.target) * 100),
      100
    );
    const tierColor = badgeTierToColor(badge.tier);

    return (
      <View
        className="rounded-xl p-4 mb-4 shadow-sm border-2"
        style={{
          backgroundColor: colors.card,
          borderColor: isEquipped ? colors.primary : colors.border
        }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: tierColor }}
            >
              <Text className="text-xs font-bold text-white">
                {badge.tier && badge.tier.length > 0 ? badge.tier[0].toUpperCase() : "?"}
              </Text>
            </View>
            <Text className="text-base font-semibold" style={{ color: colors.text }}>
              {badge.name}
            </Text>
          </View>
          {isOwned && !isEquipped && (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          )}
        </View>

        <Text className="text-sm mb-3" style={{ color: colors.textSecondary }}>{badge.description}</Text>

        {/* Progress */}
        {!isOwned && (
          <View className="mb-3">
            <Text className="text-sm font-medium mb-1" style={{ color: colors.text }}>
              Tiến độ: {progress.current} / {progress.target}
            </Text>
            <View className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface }}>
              <View
                className="h-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
          </View>
        )}

        {/* Buttons */}
        <View>
          {!isOwned ? (
            percentage >= 100 ? (
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={() => handleClaimBadge(badge)}
              >
                <Text className="text-white text-center font-semibold">
                  Claim
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-xs text-center" style={{ color: colors.textTertiary }}>
                Continue...
              </Text>
            )
          ) : isEquipped ? (
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.error }}
              onPress={() => handleUnequipBadge(badge._id)}
            >
              <Text className="text-white text-center font-semibold">
                Unequip
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.success }}
              onPress={() => handleEquipBadge(badge._id)}
            >
              <Text className="text-white text-center font-semibold">
                Equip
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>

      {/* Tabs */}
      <View className="flex-row" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <TouchableOpacity
          className="flex-1 py-3 items-center border-b-2"
          style={{ borderBottomColor: activeTab === "my" ? colors.primary : "transparent" }}
          onPress={() => setActiveTab("my")}
        >
          <Text
            className="font-medium"
            style={{ color: activeTab === "my" ? colors.primary : colors.textSecondary }}
          >
            My Badges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3 items-center border-b-2 relative"
          style={{ borderBottomColor: activeTab === "all" ? colors.primary : "transparent" }}
          onPress={() => setActiveTab("all")}
        >
          <Text
            className="font-medium"
            style={{ color: activeTab === "all" ? colors.primary : colors.textSecondary }}
          >
            All Badges
          </Text>
          {unclaimedCompletedCount > 0 && (
            <View className="absolute top-2 right-8 w-2 h-2 rounded-full" style={{ backgroundColor: colors.error }} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {activeTab === "my" ? (
          userBadgeInventory.length > 0 ? (
            <View className="p-4">
              {userBadgeInventory
                .sort((a, b) => (b.isEquipped ? 1 : 0) - (a.isEquipped ? 1 : 0))
                .map((item, index) => {
                  const badge = item.badgeId || item;
                  const isEquipped =
                    equippedBadgeId === badge._id ||
                    item.isEquipped;
                  return (
                    <View key={badge._id || item._id || `badge-${index}`}>
                      {renderBadgeCard(badge, true, isEquipped)}
                    </View>
                  );
                })}
            </View>
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="trophy-outline" size={64} color={colors.textTertiary} />
              <Text className="mt-4 text-center" style={{ color: colors.textSecondary }}>
                You don't have any badges yet
              </Text>
            </View>
          )
        ) : (
          <View className="p-4">
            {/* Filters */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium mb-1" style={{ color: colors.text }}>
                  Completion
                </Text>
                <View className="rounded-lg" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <View className="p-2">
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {completionFilter === "all"
                        ? "All"
                        : completionFilter === "completed"
                        ? "Completed"
                        : "Not Completed"}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium mb-1" style={{ color: colors.text }}>
                  Tier
                </Text>
                <View className="rounded-lg" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                  <View className="p-2">
                    <Text className="text-sm" style={{ color: colors.text }}>
                      {tierFilter === "all" ? "All" : tierFilter}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Badges Grid */}
            {filteredBadges.length > 0 ? (
              filteredBadges.map((badge, index) => {
                const isOwned = ownedBadgeIds.has(badge._id);
                const isEquipped = equippedBadgeId === badge._id;
                return (
                  <View key={badge._id || `badge-all-${index}`}>
                    {renderBadgeCard(badge, isOwned, isEquipped)}
                  </View>
                );
              })
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
                <Text className="mt-4 text-center" style={{ color: colors.textSecondary }}>
                  No badges found
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
      </View>
    </MainLayout>
  );
}

