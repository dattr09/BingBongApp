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
        Alert.alert("Thành công", "Đã nhận danh hiệu!");
        fetchData();
      } else {
        Alert.alert("Lỗi", res.message || "Không thể nhận danh hiệu");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi nhận danh hiệu");
    }
  };

  const handleEquipBadge = async (badgeId) => {
    try {
      const res = await equipBadge(badgeId);
      if (res.success) {
        setEquippedBadgeId(badgeId);
        fetchData();
      } else {
        Alert.alert("Lỗi", res.message || "Không thể trang bị danh hiệu");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi trang bị danh hiệu");
    }
  };

  const handleUnequipBadge = async (badgeId) => {
    try {
      const res = await unequipBadge(badgeId);
      if (res.success) {
        setEquippedBadgeId(null);
        fetchData();
      } else {
        Alert.alert("Lỗi", res.message || "Không thể gỡ danh hiệu");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi gỡ danh hiệu");
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
        className={`bg-white rounded-xl p-4 mb-4 shadow-sm border-2 ${
          isEquipped ? "border-blue-500" : "border-gray-100"
        }`}
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
            <Text className="text-base font-semibold text-gray-900">
              {badge.name}
            </Text>
          </View>
          {isOwned && !isEquipped && (
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          )}
        </View>

        <Text className="text-sm text-gray-600 mb-3">{badge.description}</Text>

        {/* Progress */}
        {!isOwned && (
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-800 mb-1">
              Tiến độ: {progress.current} / {progress.target}
            </Text>
            <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: "#3B82F6",
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
                className="px-4 py-2 bg-blue-600 rounded-lg"
                onPress={() => handleClaimBadge(badge)}
              >
                <Text className="text-white text-center font-semibold">
                  Nhận
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-gray-500 text-xs text-center">
                Tiếp tục...
              </Text>
            )
          ) : isEquipped ? (
            <TouchableOpacity
              className="px-4 py-2 bg-red-500 rounded-lg"
              onPress={() => handleUnequipBadge(badge._id)}
            >
              <Text className="text-white text-center font-semibold">
                Gỡ
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="px-4 py-2 bg-green-600 rounded-lg"
              onPress={() => handleEquipBadge(badge._id)}
            >
              <Text className="text-white text-center font-semibold">
                Trang bị
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
      <View className="flex-1 bg-gray-50">

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === "my"
              ? "border-blue-500"
              : "border-transparent"
          }`}
          onPress={() => setActiveTab("my")}
        >
          <Text
            className={`font-medium ${
              activeTab === "my" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            Danh hiệu của tôi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 items-center border-b-2 relative ${
            activeTab === "all"
              ? "border-blue-500"
              : "border-transparent"
          }`}
          onPress={() => setActiveTab("all")}
        >
          <Text
            className={`font-medium ${
              activeTab === "all" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            Tất cả danh hiệu
          </Text>
          {unclaimedCompletedCount > 0 && (
            <View className="absolute top-2 right-8 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
              <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
              <Text className="text-gray-500 mt-4 text-center">
                Bạn chưa có danh hiệu nào
              </Text>
            </View>
          )
        ) : (
          <View className="p-4">
            {/* Filters */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Hoàn thành
                </Text>
                <View className="bg-white border border-gray-300 rounded-lg">
                  <View className="p-2">
                    <Text className="text-sm text-gray-900">
                      {completionFilter === "all"
                        ? "Tất cả"
                        : completionFilter === "completed"
                        ? "Đã hoàn thành"
                        : "Chưa hoàn thành"}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Hạng
                </Text>
                <View className="bg-white border border-gray-300 rounded-lg">
                  <View className="p-2">
                    <Text className="text-sm text-gray-900">
                      {tierFilter === "all" ? "Tất cả" : tierFilter}
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
                <Ionicons name="search-outline" size={64} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4 text-center">
                  Không tìm thấy danh hiệu
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

