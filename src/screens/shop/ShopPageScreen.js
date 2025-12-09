import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getAllShops, getMyShops, getFollowedShops } from "../../services/shopService";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const ShopCard = ({ shop, onPress, colors }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-2xl shadow-sm mb-4 overflow-hidden"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      {/* Cover Image */}
      <View className="relative w-full h-36 overflow-hidden">
        <Image
          source={{ uri: getFullUrl(shop.coverPhoto) }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        
        {/* Avatar + Shop Name */}
        <View className="absolute bottom-2 left-3 flex-row items-center">
          <Image
            source={{ uri: getFullUrl(shop.avatar) }}
            className="w-12 h-12 rounded-full border-2 border-white"
          />
          <View className="ml-2">
            <Text className="text-base font-semibold text-white">
              {shop.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Address */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
          <Text className="text-sm ml-1 flex-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
            {shop.description?.address || "No address available"}
          </Text>
        </View>

        {/* Followers */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="people-outline" size={16} color={colors.textTertiary} />
          <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
            {shop.followers?.length || 0} followers
          </Text>
        </View>

        {/* View Shop Button */}
        <TouchableOpacity className="rounded-md py-2" style={{ backgroundColor: colors.primary }}>
          <Text className="text-white text-sm text-center font-medium">
            View Shop
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function ShopPageScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [shops, setShops] = useState([]);
  const [myShops, setMyShops] = useState([]);
  const [followedShops, setFollowedShops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const [allRes, mineRes, followedRes] = await Promise.all([
        getAllShops(),
        getMyShops(),
        getFollowedShops(),
      ]);

      if (allRes.success) setShops(allRes.data || []);
      if (mineRes.success) setMyShops(mineRes.data || []);
      if (followedRes.success) setFollowedShops(followedRes.data || []);
    } catch (error) {
      console.error("Fetch shops error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let source = shops;
    if (activeTab === "my") source = myShops;
    else if (activeTab === "followed") source = followedShops;

    if (!searchTerm.trim()) {
      setFiltered(source);
    } else {
      const lower = searchTerm.toLowerCase();
      setFiltered(
        source.filter(
          (shop) =>
            shop.name?.toLowerCase().includes(lower) ||
            shop.description?.toLowerCase().includes(lower) ||
            shop.description?.address?.toLowerCase().includes(lower)
        )
      );
    }
  }, [activeTab, shops, myShops, followedShops, searchTerm]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleShopPress = (shop) => {
    navigation.navigate("DetailShop", { shopSlug: shop.slug });
  };

  const tabs = [
    { key: "all", label: "All Shops" },
    { key: "my", label: "My Shops" },
    { key: "followed", label: "Followed" },
  ];

  if (loading && !refreshing && filtered.length === 0) {
    return (
      <MainLayout disableScroll={true}>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout disableScroll={true}>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View className="rounded-lg p-4 mb-4 shadow-sm" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {/* Tabs */}
          <View className="flex-row gap-2 mb-3">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="px-3 py-1.5 rounded-md"
                style={{ backgroundColor: activeTab === tab.key ? colors.primary : colors.surface }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: activeTab === tab.key ? "#fff" : colors.text }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View className="relative">
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textTertiary}
              style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              placeholder="Search shops..."
              placeholderTextColor={colors.textTertiary}
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="rounded-md pl-10 pr-3 py-2 text-sm"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
            />
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item._id || `shop-${index}`}
          renderItem={({ item }) => (
            <ShopCard shop={item} onPress={() => handleShopPress(item)} colors={colors} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10 p-5">
              <Text className="text-center" style={{ color: colors.textSecondary }}>
                {loading
                  ? "Loading..."
                  : "No shops found."}
              </Text>
            </View>
          }
        />
      </View>
    </MainLayout>
  );
}

