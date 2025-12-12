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
import { getFullUrl } from "../../utils/getPic";

const ShopCard = ({ shop, onPress, colors }) => {
  // Display up to 3 categories for cleaner layout
  const displayCategories = shop.categories?.slice(0, 3) || [];

  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-2xl shadow-sm mb-4 overflow-hidden"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, width: "100%" }}
      activeOpacity={0.8}
    >
      {/* Cover Image */}
      <View style={{ position: "relative", width: "100%", height: 144, overflow: "hidden" }}>
        <Image
          source={{ uri: getFullUrl(shop.coverPhoto) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.4)" }} />
        
        {/* Avatar + Shop Name */}
        <View style={{ position: "absolute", bottom: 8, left: 12, flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: getFullUrl(shop.avatar) }}
            style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "#fff" }}
          />
          <View style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff", textShadowColor: "rgba(0, 0, 0, 0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {shop.name}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>
        {/* Address */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
          <Text style={{ fontSize: 13, marginLeft: 4, flex: 1, color: colors.textSecondary }} numberOfLines={1}>
            {shop.description?.address || "No address available"}
          </Text>
        </View>

        {/* Followers */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Ionicons name="people-outline" size={16} color={colors.textTertiary} />
          <Text style={{ fontSize: 13, marginLeft: 4, color: colors.textSecondary }}>
            {shop.followers?.length || 0} followers
          </Text>
        </View>

        {/* Product Categories */}
        {displayCategories.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name="pricetag-outline" size={14} color={colors.textTertiary} style={{ marginRight: 4 }} />
            {displayCategories.map((cat) => (
              <View
                key={cat._id}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  marginRight: 6,
                  marginBottom: 4,
                }}
              >
                <Text style={{ fontSize: 11, color: colors.text }}>
                  {cat.name}
                </Text>
              </View>
            ))}
            {shop.categories?.length > 3 && (
              <Text style={{ fontSize: 11, color: colors.textTertiary }}>
                +{shop.categories.length - 3} more
              </Text>
            )}
          </View>
        )}

        {/* View Shop Button */}
        <TouchableOpacity 
          onPress={onPress}
          style={{ borderRadius: 8, paddingVertical: 10, backgroundColor: colors.primary }}
          activeOpacity={0.8}
        >
          <Text style={{ color: "#fff", fontSize: 13, textAlign: "center", fontWeight: "500" }}>
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
    { key: "followed", label: "Followed Shops" },
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
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

