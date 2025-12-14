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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

// Components & Services
import FriendRequestScreen from "./FriendRequestScreen";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import { getUserProfile } from "../../services/profileService";
import {
  getSuggestions,
  cancelFriendRequest,
  sendFriendRequest,
} from "../../services/friendService";

export default function FriendScreen() {
  const route = useRoute();
  const { colors } = useThemeSafe();

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

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      // --- FIX: LẤY USER TỪ STORAGE ĐỂ HIỂN THỊ HEADER ---
      const storedUser = await AsyncStorage.getItem("user");
      let parsedUser = null;
      if (storedUser) {
        parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }

      // A. Lấy thông tin Profile (chứa invites)
      const profileRes = await getUserProfile();
      if (profileRes.success) {
        const userData = profileRes.data?.data || profileRes.data || {};
        setInvites(userData.friendRequests || []);
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
      Toast.show({ type: "success", text1: "Request cancelled" });
      setSentRequests((prev) => prev.filter((u) => u._id !== userId));
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.message });
    }
    setActionLoadingId(null);
  };

  const handleAddFriend = async (userId) => {
    setActionLoadingId(userId);
    const result = await sendFriendRequest(userId);

    if (result.success) {
      Toast.show({ type: "success", text1: "Friend request sent" });
      const userToAdd = suggestions.find((u) => u._id === userId);
      setSuggestions((prev) => prev.filter((u) => u._id !== userId));
      if (userToAdd) {
        setSentRequests((prev) => {
          // Kiểm tra xem user đã có trong list chưa
          const exists = prev.some((u) => u._id === userId);
          if (exists) return prev;
          return [userToAdd, ...prev];
        });
      }
    } else {
      Toast.show({ type: "error", text1: "Error", text2: result.message });
    }
    setActionLoadingId(null);
  };

  const handleRemoveSuggestion = (userId) => {
    setSuggestions((prev) => prev.filter((u) => u._id !== userId));
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} backgroundColor={colors.primary} />

      {/* HEADER */}
      <View
        className="flex-row items-center px-5 pt-6 pb-5"
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
        <View className="flex-row items-center gap-4">
          <Image
            // Sử dụng ảnh của currentUser đã load từ AsyncStorage
            source={{ uri: getFullUrl(currentUser?.avatar) || "https://i.pravatar.cc/300?img=1" }}
            className="h-12 w-12 rounded-full border-4 border-white shadow"
          />
          <Text className="text-white text-2xl font-extrabold tracking-wide">
            Friends
          </Text>
        </View>
      </View>

      {/* TAB BAR */}
      <View className="flex-row justify-center gap-3 mb-7 mt-5 px-4">
        {/* Tab Requests */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0 overflow-hidden"
          onPress={() => setTab("invite")}
          style={{
            maxWidth: 140,
            backgroundColor: tab === "invite" ? colors.success + '15' : colors.surface,
            borderColor: tab === "invite" ? colors.success : colors.border
          }}
        >
          <View className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: colors.success }} />
          <Text
            className="text-xs font-bold flex-shrink"
            numberOfLines={1}
            style={{
              textAlign: "center",
              color: tab === "invite" ? colors.success : colors.textSecondary
            }}
          >
            {invites.length} requests
          </Text>
        </TouchableOpacity>

        {/* Tab Sent */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0"
          onPress={() => setTab("sent")}
          style={{
            backgroundColor: tab === "sent" ? colors.primary + '15' : colors.surface,
            borderColor: tab === "sent" ? colors.primary : colors.border
          }}
        >
          <Ionicons
            name="paper-plane-outline"
            size={18}
            color={tab === "sent" ? colors.primary : colors.textTertiary}
            style={{ marginRight: 6 }}
          />
          <Text
            className="text-sm font-bold flex-shrink"
            style={{ color: tab === "sent" ? colors.primary : colors.textSecondary }}
          >
            Sent
          </Text>
        </TouchableOpacity>

        {/* Tab Suggestions */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0"
          onPress={() => setTab("suggest")}
          style={{
            backgroundColor: tab === "suggest" ? colors.surface : colors.surface,
            borderColor: tab === "suggest" ? colors.border : colors.border
          }}
        >
          <Ionicons
            name="people-outline"
            size={18}
            color={tab === "suggest" ? colors.textSecondary : colors.textTertiary}
            style={{ marginRight: 6 }}
          />
          <Text
            className="text-sm font-bold flex-shrink"
            style={{ color: tab === "suggest" ? colors.text : colors.textSecondary }}
          >
            Suggestions
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <ScrollView
        className="px-4 pt-2 pb-2"
        style={{ backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {loading && !refreshing ? (
          <View className="py-10">
            <ActivityIndicator size="large" color={colors.primary} />
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
                <Text className="text-xl font-extrabold mb-5 mt-2 tracking-wide px-1" style={{ color: colors.primary }}>
                  Sent Requests ({sentRequests.length})
                </Text>
                {sentRequests.length === 0 && (
                  <Text className="text-center mb-6 mt-4" style={{ color: colors.textTertiary }}>
                    You haven't sent any requests
                  </Text>
                )}
                {sentRequests.map((user) => (
                  <View
                    key={user._id}
                    className="flex-row items-center gap-5 rounded-3xl shadow-2xl mb-7 px-5 py-5"
                    style={{ elevation: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Image
                      source={{ uri: getFullUrl(user.avatar) || "https://i.pravatar.cc/300?img=1" }}
                      className="h-16 w-16 rounded-full border-2 shadow"
                      style={{ borderColor: colors.primary + '50' }}
                    />
                    <View className="flex-1">
                      <Text className="text-base font-extrabold mb-2" style={{ color: colors.text }}>
                        {user.fullName || `${user.firstName} ${user.surname}`}
                      </Text>
                      <View className="flex-row gap-3 mt-1">
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2 items-center"
                          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                          disabled={true}
                        >
                          <Text className="font-bold text-xs" style={{ color: colors.textSecondary }}>
                            Sent
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2 items-center"
                          style={{ backgroundColor: colors.error + '15', borderWidth: 1, borderColor: colors.error + '30' }}
                          onPress={() => handleCancelRequest(user._id)}
                          disabled={actionLoadingId === user._id}
                        >
                          {actionLoadingId === user._id ? (
                            <ActivityIndicator size="small" color={colors.error} />
                          ) : (
                            <Text className="font-bold text-xs" style={{ color: colors.error }}>
                              Cancel
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
                <Text className="text-xl font-extrabold mb-5 mt-2 tracking-wide px-1" style={{ color: colors.text }}>
                  Friend Suggestions
                </Text>
                {suggestions.length === 0 && (
                  <Text className="text-center mb-6 mt-4" style={{ color: colors.textTertiary }}>
                    No suggestions
                  </Text>
                )}
                {suggestions.map((user) => (
                  <View
                    key={user._id}
                    className="flex-row items-center gap-5 rounded-3xl shadow-2xl mb-7 px-5 py-5"
                    style={{ elevation: 4, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Image
                      source={{ uri: getFullUrl(user.avatar) || "https://i.pravatar.cc/300?img=1" }}
                      className="h-16 w-16 rounded-full border-2 shadow"
                      style={{ borderColor: colors.border }}
                    />
                    <View className="flex-1">
                      <Text className="text-base font-extrabold mb-2" style={{ color: colors.text }}>
                        {user.fullName || `${user.firstName} ${user.surname}`}
                      </Text>
                      <View className="flex-row gap-3 mt-1">
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2 items-center shadow-sm"
                          style={{ backgroundColor: colors.primary }}
                          onPress={() => handleAddFriend(user._id)}
                          disabled={actionLoadingId === user._id}
                        >
                          {actionLoadingId === user._id ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text className="text-white font-bold text-xs tracking-wide">
                              Add Friend
                            </Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-1 rounded-lg py-2 items-center"
                          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                          onPress={() => handleRemoveSuggestion(user._id)}
                        >
                          <Text className="font-bold text-xs" style={{ color: colors.textSecondary }}>
                            Remove
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
