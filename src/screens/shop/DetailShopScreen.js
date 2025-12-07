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
          <Text className="text-gray-500 text-center">
            Không tìm thấy cửa hàng
          </Text>
        </View>
      </MainLayout>
    );
  }

  const isMyShop = currentUser && shop.owner?._id === currentUser._id;

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View className="relative w-full h-64">
          <Image
            source={{ uri: getFullUrl(shop.coverPhoto) }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </View>

        {/* Avatar */}
        <View className="relative -mt-16 mb-4 px-4">
          <View className="flex-row items-end">
            <Image
              source={{ uri: getFullUrl(shop.avatar) }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
            <View className="ml-4 mb-4 flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                {shop.name}
              </Text>
              <Text className="text-gray-500 mt-1">
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
                className={`flex-1 flex-row items-center justify-center py-3 rounded-md ${
                  isFollowing ? "bg-gray-200" : "bg-blue-600"
                }`}
              >
                <Ionicons
                  name={isFollowing ? "checkmark" : "add"}
                  size={20}
                  color={isFollowing ? "#000" : "#fff"}
                />
                <Text
                  className={`ml-2 font-medium ${
                    isFollowing ? "text-black" : "text-white"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 flex-row items-center justify-center py-3 rounded-md bg-gray-200">
                <Ionicons name="chatbubble-outline" size={20} color="#000" />
                <Text className="ml-2 font-medium text-black">Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Tabs */}
        <View className="px-4 mb-4 flex-row border-b border-gray-200">
          {["posts", "products", "about"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`pb-3 px-4 mr-4 ${
                activeTab === tab
                  ? "border-b-2 border-blue-600"
                  : "border-b-2 border-transparent"
              }`}
            >
              <Text
                className={`font-medium ${
                  activeTab === tab ? "text-blue-600" : "text-gray-500"
                }`}
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
              <Text className="text-gray-700 leading-6">
                {shop.description || "No description available"}
              </Text>
              {shop.description?.address && (
                <View className="mt-4 flex-row items-center">
                  <Ionicons name="location-outline" size={20} color="#6b7280" />
                  <Text className="text-gray-700 ml-2">
                    {shop.description.address}
                  </Text>
                </View>
              )}
            </View>
          )}
          {activeTab === "posts" && (
            <View className="items-center py-10">
              <Text className="text-gray-500">Posts coming soon</Text>
            </View>
          )}
          {activeTab === "products" && (
            <View className="items-center py-10">
              <Text className="text-gray-500">Products coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

