import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // 1. Import AsyncStorage
import { API_URL } from "@env";

// Components & Services
import FriendRequestScreen from "./FriendRequestScreen";
import { getUserProfile } from "../../services/profileService";
import {
  getSuggestions,
  cancelFriendRequest,
  sendFriendRequest,
} from "../../services/friendService";

export default function FriendScreen() {
  const route = useRoute();

  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null); // State lưu người dùng hiện tại
  const [invites, setInvites] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState(route.params?.initialTab || "invite");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (route.params?.initialTab) {
      setTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  // --- HELPER: XỬ LÝ ẢNH ---
  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url.startsWith("http")) return url;
    // Ưu tiên API_URL từ env, nếu không thì dùng Config
    const baseUrl = API_URL;
    return `${baseUrl}${url}`;
  };

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      // --- FIX: LẤY USER TỪ STORAGE ĐỂ HIỂN THỊ HEADER ---
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }

      // A. Lấy thông tin Profile (chứa invites & sentRequests)
      const profileRes = await getUserProfile();
      if (profileRes.success) {
        // Cập nhật lại currentUser từ API để đảm bảo dữ liệu mới nhất (nếu cần)
        // setCurrentUser(profileRes.data);

        const userData = profileRes.data?.data || profileRes.data || {};
        setInvites(userData.friendRequests || []);
        setSentRequests(userData.sentFriendRequests || []);
      }

      // B. Lấy danh sách gợi ý
      const suggestRes = await getSuggestions();
      if (suggestRes.success) {
        const suggestionList = suggestRes.data?.data || suggestRes.data || [];
        setSuggestions(Array.isArray(suggestionList) ? suggestionList : []);
      }
    } catch (error) {
      console.error("FriendScreen Fetch Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- 2. HANDLERS ---
  const handleCancelRequest = async (userId) => {
    setActionLoadingId(userId);
    const result = await cancelFriendRequest(userId);
    if (result.success) {
      Toast.show({ type: "success", text1: "Đã thu hồi lời mời" });
      setSentRequests((prev) => prev.filter((u) => u._id !== userId));
    } else {
      Toast.show({ type: "error", text1: "Lỗi", text2: result.message });
    }
    setActionLoadingId(null);
  };

  const handleAddFriend = async (userId) => {
    setActionLoadingId(userId);
    const result = await sendFriendRequest(userId);

    if (result.success) {
      Toast.show({ type: "success", text1: "Đã gửi lời mời kết bạn" });
      const userToAdd = suggestions.find((u) => u._id === userId);
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
      if (userToAdd) {
        setSentRequests((prev) => [userToAdd, ...prev]);
      }
    } else {
      Toast.show({ type: "error", text1: "Lỗi", text2: result.message });
    }
    setActionLoadingId(null);
  };

  const handleRemoveSuggestion = (userId) => {
    setSuggestions((prev) => prev.filter((u) => u._id !== userId));
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-[#e0e7ff] to-[#f0fdfa]">
      <StatusBar barStyle="dark-content" backgroundColor="#e0e7ff" />

      {/* HEADER */}
      <View
        className="flex-row items-center px-5 pt-6 pb-5"
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
        <View className="flex-row items-center gap-4">
          <Image
            // Sử dụng ảnh của currentUser đã load từ AsyncStorage
            source={{ uri: getAvatarUrl(currentUser?.avatar) }}
            className="h-12 w-12 rounded-full border-4 border-white shadow"
          />
          <Text className="text-white text-2xl font-extrabold tracking-wide">
            Bạn bè
          </Text>
        </View>
      </View>

      {/* TAB BAR */}
      <View className="flex-row justify-center gap-3 mb-7 mt-5 px-4">
        {/* Tab Lời mời */}
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0 overflow-hidden ${tab === "invite" ? "bg-green-50 border-green-400" : "bg-green-50 border-green-200"}`}
          onPress={() => setTab("invite")}
          style={{ maxWidth: 140 }}
        >
          <View className="h-3 w-3 rounded-full bg-green-500 mr-2" />
          <Text
            className={`text-xs font-bold flex-shrink ${tab === "invite" ? "text-green-700" : "text-green-500"}`}
            numberOfLines={1}
            style={{ textAlign: "center" }}
          >
            {invites.length} lời mời
          </Text>
        </TouchableOpacity>

        {/* Tab Đã gửi */}
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0 ${tab === "sent" ? "bg-sky-50 border-sky-400" : "bg-sky-50 border-sky-200"}`}
          onPress={() => setTab("sent")}
        >
          <Ionicons
            name="paper-plane-outline"
            size={18}
            color={tab === "sent" ? "#0ea5e9" : "#38bdf8"}
            style={{ marginRight: 6 }}
          />
          <Text
            className={`text-sm font-bold flex-shrink ${tab === "sent" ? "text-sky-700" : "text-sky-500"}`}
          >
            Đã gửi
          </Text>
        </TouchableOpacity>

        {/* Tab Gợi ý */}
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0 ${tab === "suggest" ? "bg-gray-50 border-gray-400" : "bg-gray-50 border-gray-200"}`}
          onPress={() => setTab("suggest")}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={tab === "suggest" ? "#64748b" : "#a3a3a3"}
            style={{ marginRight: 6 }}
          />
          <Text
            className={`text-sm font-bold flex-shrink ${tab === "suggest" ? "text-gray-700" : "text-gray-500"}`}
          >
            Gợi ý
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <ScrollView
        className="px-4 pt-2 pb-2"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#38bdf8"]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-10">
            <ActivityIndicator size="large" color="#38bdf8" />
          </View>
        ) : (
          <>
            {/* --- TAB 1: INVITES --- */}
            {tab === "invite" && (
              <FriendRequestScreen
                invites={invites}
                onUpdateList={setInvites}
              />
            )}

            {/* --- TAB 2: SENT REQUESTS --- */}
            {tab === "sent" && (
              <>
                <Text className="text-xl font-extrabold text-sky-700 mb-5 mt-2 tracking-wide px-1">
                  Lời mời bạn đã gửi ({sentRequests.length})
                </Text>
                {sentRequests.length === 0 && (
                  <Text className="text-center text-gray-400 mb-6 mt-4">
                    Bạn chưa gửi lời mời nào
                  </Text>
                )}
                {sentRequests.map((user) => (
                  <View
                    key={user._id}
                    className="flex-row items-center gap-5 rounded-3xl bg-white shadow-2xl mb-7 px-5 py-5 border border-sky-100"
                    style={{ elevation: 4 }}
                  >
                    <Image
                      source={{ uri: getAvatarUrl(user.avatar) }}
                      className="h-16 w-16 rounded-full border-2 border-sky-300 shadow"
                    />
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-sky-900 mb-2">
                        {user.fullName || `${user.firstName} ${user.surname}`}
                      </Text>
                      <View className="flex-row gap-3 mt-1">
                        <TouchableOpacity
                          className="flex-1 rounded-lg bg-gray-100 py-2 items-center border border-gray-200"
                          disabled={true}
                        >
                          <Text className="text-gray-500 font-bold text-xs">
                            Đã gửi
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 rounded-lg bg-red-50 py-2 items-center border border-red-200"
                          onPress={() => handleCancelRequest(user._id)}
                          disabled={actionLoadingId === user._id}
                        >
                          {actionLoadingId === user._id ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Text className="text-red-600 font-bold text-xs">
                              Thu hồi
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* --- TAB 3: SUGGESTIONS --- */}
            {tab === "suggest" && (
              <>
                <Text className="text-xl font-extrabold text-gray-700 mb-5 mt-2 tracking-wide px-1">
                  Gợi ý kết bạn
                </Text>
                {suggestions.length === 0 && (
                  <Text className="text-center text-gray-400 mb-6 mt-4">
                    Không có gợi ý nào
                  </Text>
                )}
                {suggestions.map((user) => (
                  <View
                    key={user._id}
                    className="flex-row items-center gap-5 rounded-3xl bg-white shadow-2xl mb-7 px-5 py-5 border border-gray-200"
                    style={{ elevation: 4 }}
                  >
                    <Image
                      source={{ uri: getAvatarUrl(user.avatar) }}
                      className="h-16 w-16 rounded-full border-2 border-gray-300 shadow"
                    />
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-gray-800 mb-2">
                        {user.fullName || `${user.firstName} ${user.surname}`}
                      </Text>
                      <View className="flex-row gap-3 mt-1">
                        <TouchableOpacity
                          className="flex-1 rounded-lg bg-sky-500 py-2 items-center shadow-sm"
                          onPress={() => handleAddFriend(user._id)}
                          disabled={actionLoadingId === user._id}
                        >
                          {actionLoadingId === user._id ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text className="text-white font-bold text-xs tracking-wide">
                              Kết bạn
                            </Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 rounded-lg bg-gray-100 py-2 items-center border border-gray-300"
                          onPress={() => handleRemoveSuggestion(user._id)}
                        >
                          <Text className="text-gray-600 font-bold text-xs">
                            Xóa
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
