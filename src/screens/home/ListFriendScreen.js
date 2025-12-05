import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "@env";
// Services
import { getUserProfile } from "../../services/profileService";
const numColumns = 2;
const CARD_WIDTH = (Dimensions.get("window").width - 48) / numColumns;

export default function ListFriendScreen({ navigation }) {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- HELPER: XỬ LÝ ẢNH ---
  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      // Lấy thông tin user hiện tại từ Local Storage để hiển thị header
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }

      // Gọi API lấy profile để lấy danh sách bạn bè
      const result = await getUserProfile();
      if (result.success) {
        // Giả sử backend trả về friend list đã được populate trong result.data.friends
        setFriends(result.data.friends || []);
      }
    } catch (error) {
      console.error("ListFriendScreen Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load lại dữ liệu mỗi khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- 2. LỌC TÌM KIẾM ---
  const filteredData = friends.filter((f) => {
    const fullName = f.fullName || `${f.firstName} ${f.surname}`;
    return fullName.toLowerCase().includes(search.toLowerCase());
  });

  // --- 3. RENDER CARD ---
  const renderFriendItem = ({ item }) => {
    const displayName = item.fullName || `${item.firstName} ${item.surname}`;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile", { userId: item._id })}
        className="bg-white rounded-3xl shadow-xl px-3 py-5 items-center w-[90%] mx-auto"
        style={{
          width: CARD_WIDTH,
          minHeight: 190,
          elevation: 6,
        }}
        activeOpacity={0.88}
      >
        <View className="relative mb-3">
          <Image
            source={{ uri: getAvatarUrl(item.avatar) }}
            className="w-20 h-20 rounded-full border-4 border-sky-300 shadow"
          />
          {/* Status online (Tạm thời check field online nếu backend có, hoặc ẩn đi) */}
          {item.isOnline && (
            <View className="absolute bottom-2 right-2 w-5 h-5 bg-white rounded-full items-center justify-center">
              <View className="w-3 h-3 rounded-full bg-green-500" />
            </View>
          )}
        </View>

        <Text
          className="text-base font-bold text-sky-900 text-center mb-1"
          numberOfLines={1}
        >
          {displayName}
        </Text>

        <Text
          className={`text-xs ${item.isOnline ? "text-green-500" : "text-gray-400"}`}
        >
          {item.isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
        </Text>

        <TouchableOpacity
          className="mt-4 px-4 py-2 rounded-full bg-sky-100 flex-row items-center justify-center w-full"
          onPress={() => navigation.navigate("Chat", { userChat: item })}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={16}
            color="#0ea5e9"
          />
          <Text className="ml-2 text-sky-700 font-semibold text-xs">
            Nhắn tin
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-cyan-100 to-sky-200">
      <StatusBar barStyle="dark-content" backgroundColor="#e0f2fe" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-4 pb-4"
        style={{
          backgroundColor: Platform.OS === "android" ? "#38bdf8" : undefined,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: "#38bdf8",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        }}
      >
        {/* Avatar + Tiêu đề */}
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: getAvatarUrl(currentUser?.avatar) }}
            className="h-12 w-12 rounded-full border-4 border-white shadow"
          />
          <View>
            <Text className="text-white text-lg font-extrabold tracking-wide">
              Bạn bè
            </Text>
            <Text className="text-sky-100 text-xs font-medium">
              {friends.length} người bạn
            </Text>
          </View>
        </View>

        {/* Icon bên phải */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="p-2 rounded-full bg-white shadow-lg mx-1"
            onPress={() =>
              navigation.navigate("Friends", { initialTab: "suggest" })
            } // Điều hướng sang màn hình Lời mời/Gợi ý
          >
            <Ionicons name="person-add-outline" size={22} color="#0ea5e9" />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2 rounded-full bg-white shadow-lg mx-1"
            onPress={() => navigation.navigate("Messenger")}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color="#0ea5e9"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Thanh tìm kiếm */}
      <View className="mx-7 mt-4 z-10 shadow-xl mb-2">
        <View className="flex-row items-center bg-white rounded-2xl px-5 py-3 border border-sky-100">
          <Ionicons name="search-outline" size={22} color="#38bdf8" />
          <TextInput
            className="flex-1 ml-3 text-base text-sky-900"
            placeholder="Tìm kiếm bạn bè..."
            placeholderTextColor="#7dd3fc"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Danh sách bạn bè */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          className="mt-2"
          contentContainerStyle={{
            paddingHorizontal: 12,
            paddingBottom: 24,
            paddingTop: 10,
          }}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 18,
          }}
          renderItem={renderFriendItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0ea5e9"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="people-outline" size={54} color="#38bdf8" />
              <Text className="text-sky-400 text-lg font-semibold mt-3">
                {search ? "Không tìm thấy kết quả" : "Chưa có bạn bè nào"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
