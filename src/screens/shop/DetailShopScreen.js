import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getShopBySlug, followShop, unfollowShop } from "../../services/shopService";
import { getUser } from "../../utils/storage";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function DetailShopScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const { shopSlug } = route.params || {};
  
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchShop = async () => {
      if (!shopSlug) return;
      setLoading(true);
      try {
        const res = await getShopBySlug(shopSlug);
        if (res.success) {
          setShop(res.data);
          setIsFollowing(res.data.followers?.includes(currentUser?._id) || false);
        }
      } catch (error) {
        console.error("Fetch shop error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [shopSlug, currentUser?._id]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    
    const previous = isFollowing;
    setIsFollowing(!previous);

    try {
      const response = previous
        ? await unfollowShop(shop._id)
        : await followShop(shop._id);

      if (!response.success) {
        setIsFollowing(previous);
      } else {
        setShop((prev) => ({
          ...prev,
          followers: previous
            ? prev.followers.filter((id) => id !== currentUser._id)
            : [...prev.followers, currentUser._id],
        }));
      }
    } catch (error) {
      setIsFollowing(previous);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (!shop) {
    return (
      <MainLayout>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-center" style={{ color: colors.textSecondary }}>
            Shop not found
          </Text>
        </View>
      </MainLayout>
    );
  }

  const isMyShop = currentUser && shop.owner?._id === currentUser._id;

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* Cover Photo */}
        <View className="relative w-full h-64">
          <Image
            source={{ uri: getFullUrl(shop.coverPhoto) }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0" style={{ backgroundColor: colors.isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)" }} />
        </View>

        {/* Avatar */}
        <View className="relative -mt-16 mb-4 px-4">
          <View className="flex-row items-end">
            <Image
              source={{ uri: getFullUrl(shop.avatar) }}
              className="w-32 h-32 rounded-full border-4"
              style={{ borderColor: colors.card }}
            />
            <View className="ml-4 mb-4 flex-1">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {shop.name}
              </Text>
              <Text className="mt-1" style={{ color: colors.textSecondary }}>
                {shop.followers?.length || 0} followers
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 mb-4 flex-row gap-2">
          {!isMyShop && (
            <>
              <TouchableOpacity
                onPress={handleFollowToggle}
                className="flex-1 flex-row items-center justify-center py-3 rounded-md"
                style={{ backgroundColor: isFollowing ? colors.surface : colors.primary }}
              >
                <Ionicons
                  name={isFollowing ? "checkmark" : "add"}
                  size={20}
                  color={isFollowing ? colors.text : "#fff"}
                />
                <Text
                  className="ml-2 font-medium"
                  style={{ color: isFollowing ? colors.text : "#fff" }}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 flex-row items-center justify-center py-3 rounded-md" style={{ backgroundColor: colors.surface }}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
                <Text className="ml-2 font-medium" style={{ color: colors.text }}>Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Tabs */}
        <View className="px-4 mb-4 flex-row" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {["posts", "products", "about"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="pb-3 px-4 mr-4"
              style={{ borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: activeTab === tab ? colors.primary : "transparent" }}
            >
              <Text
                className="font-medium"
                style={{ color: activeTab === tab ? colors.primary : colors.textSecondary }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className="px-4 pb-8">
          {activeTab === "about" && (
            <View>
              <Text className="leading-6" style={{ color: colors.text }}>
                {shop.description || "No description available"}
              </Text>
              {shop.description?.address && (
                <View className="mt-4 flex-row items-center">
                  <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                  <Text className="ml-2" style={{ color: colors.text }}>
                    {shop.description.address}
                  </Text>
                </View>
              )}
            </View>
          )}
          {activeTab === "posts" && (
            <View className="items-center py-10">
              <Text style={{ color: colors.textSecondary }}>Posts coming soon</Text>
            </View>
          )}
          {activeTab === "products" && (
            <View className="items-center py-10">
              <Text style={{ color: colors.textSecondary }}>Products coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

