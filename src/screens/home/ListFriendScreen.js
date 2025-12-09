import React, { useState, useEffect, useCallback, useRef } from "react";
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
import io from "socket.io-client";
import { useThemeSafe } from "../../utils/themeHelper";
// Services
import { getUserProfile } from "../../services/profileService";

const Config = { BACKEND_URL: "http://192.168.1.2:8000" };
const numColumns = 2;
const CARD_WIDTH = (Dimensions.get("window").width - 48) / numColumns;

export default function ListFriendScreen({ navigation }) {
  const { colors } = useThemeSafe();
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Set of user IDs that are online

  const socket = useRef(null);

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

  // --- SOCKET SETUP FOR ONLINE STATUS ---
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;

        const me = JSON.parse(storedUser);
        const socketUrl = API_URL || Config.BACKEND_URL;

        // Tạo socket connection
        socket.current = io(socketUrl, {
          transports: ["websocket"],
        });

        socket.current.on("connect", () => {
          if (me._id) {
            socket.current.emit("setup", me._id);
          }
        });

        // Listen for online users list updates
        const handleOnlineUsers = (userIds) => {
          if (Array.isArray(userIds)) {
            setOnlineUsers(new Set(userIds));
          }
        };

        socket.current.on("getOnlineUsers", handleOnlineUsers);

        return () => {
          if (socket.current) {
            socket.current.off("getOnlineUsers", handleOnlineUsers);
          }
        };
      } catch (error) {
        console.error("Socket setup error:", error);
      }
    };

    setupSocket();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
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
        className="rounded-3xl shadow-xl px-3 py-5 items-center w-[90%] mx-auto"
        style={{
          width: CARD_WIDTH,
          minHeight: 190,
          elevation: 6,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
        activeOpacity={0.88}
      >
        <View className="relative mb-3">
          <Image
            source={{ uri: getAvatarUrl(item.avatar) }}
            className="w-20 h-20 rounded-full border-4 shadow"
            style={{ borderColor: colors.primary + '50' }}
          />
          {/* Status online - check from onlineUsers Set */}
          {item._id && onlineUsers.has(item._id?.toString() || item._id) && (
            <View className="absolute bottom-2 right-2 w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: colors.card }}>
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.success }} />
            </View>
          )}
        </View>

        <Text
          className="text-base font-bold text-center mb-1"
          style={{ color: colors.text }}
          numberOfLines={1}
        >
          {displayName}
        </Text>

        <Text
          className="text-xs"
          style={{ color: (item._id && onlineUsers.has(item._id?.toString() || item._id)) ? colors.success : colors.textTertiary }}
        >
          {(item._id && onlineUsers.has(item._id?.toString() || item._id)) ? "Active now" : "Offline"}
        </Text>

        <TouchableOpacity
          className="mt-4 px-4 py-2 rounded-full flex-row items-center justify-center w-full"
          style={{ backgroundColor: colors.primary + '15' }}
          onPress={() => navigation.navigate("Chat", { userChat: item })}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={16}
            color={colors.primary}
          />
          <Text className="ml-2 font-semibold text-xs" style={{ color: colors.primary }}>
            Message
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} backgroundColor={colors.primary} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-5 pt-4 pb-4"
        style={{
          backgroundColor: colors.primary,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          shadowColor: colors.primary,
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
              Friends
            </Text>
            <Text className="text-xs font-medium" style={{ color: colors.card + 'CC' }}>
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </Text>
          </View>
        </View>

        {/* Icon bên phải */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="p-2 rounded-full shadow-lg mx-1"
            style={{ backgroundColor: colors.card }}
            onPress={() =>
              navigation.navigate("Friends", { initialTab: "suggest" })
            } // Điều hướng sang màn hình Lời mời/Gợi ý
          >
            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            className="p-2 rounded-full shadow-lg mx-1"
            style={{ backgroundColor: colors.card }}
            onPress={() => navigation.navigate("Messenger")}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={22}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Thanh tìm kiếm */}
      <View className="mx-7 mt-4 z-10 shadow-xl mb-2">
        <View className="flex-row items-center rounded-2xl px-5 py-3" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name="search-outline" size={22} color={colors.primary} />
          <TextInput
            className="flex-1 ml-3 text-base"
            style={{ color: colors.text }}
            placeholder="Search friends..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Danh sách bạn bè */}
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          className="mt-2"
          style={{ backgroundColor: colors.background }}
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
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Ionicons name="people-outline" size={54} color={colors.primary} />
              <Text className="text-lg font-semibold mt-3" style={{ color: colors.textSecondary }}>
                {search ? "No results found" : "No friends yet"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
