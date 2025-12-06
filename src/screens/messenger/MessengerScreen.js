import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

// Components
import MessengerHeader from "../../components/MessengerHeader";
import MessengerNavbar from "../../components/MessengerNavbar";

// Services
import { getRecentChats } from "../../services/chatService";
import { getUserProfile } from "../../services/profileService";

const Config = { BACKEND_URL: "http://192.168.1.2:8000" };

export default function MessengerScreen() {
  const navigation = useNavigation();

  // --- STATE ---
  const [query, setQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- HELPER ---
  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url.startsWith("http")) return url;
    const baseUrl = API_URL || Config.BACKEND_URL;
    return `${baseUrl}${url}`;
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getReceiver = (conversation) => {
    if (!conversation?.members || !currentUser) return null;
    return conversation.members.find((m) => m._id !== currentUser._id) || {};
  };

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        // 1. Get Chats
        const chatRes = await getRecentChats();
        if (chatRes.success) {
          // Service đã xử lý mảng, nhưng check thêm cho an toàn
          setConversations(Array.isArray(chatRes.data) ? chatRes.data : []);
        }

        // 2. Get Friends
        const profileRes = await getUserProfile();
        if (profileRes.success) {
          const userData = profileRes.data?.data || profileRes.data || {};
          // FIX: Đảm bảo friends luôn là mảng
          const friendList = userData.friends || [];
          setFriends(Array.isArray(friendList) ? friendList : []);
        }
      }
    } catch (error) {
      console.error("MessengerScreen Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const filteredChats = safeConversations.filter((chat) => {
    const receiver = getReceiver(chat);
    const name = receiver?.fullName || receiver?.firstName || "";
    return name && name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
      <MessengerHeader />
      <View className="mx-6 mt-4 z-10 shadow-lg">
        <View className="flex-row items-center bg-white rounded-full px-4 py-2 border border-sky-100">
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm kiếm bạn bè, tin nhắn..."
            placeholderTextColor="#7dd3fc"
            className="flex-1 text-base text-sky-900"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0ea5e9"]}
          />
        }
      >
        {/* Friends List */}
        <View className="mt-6 px-6">
          <Text className="text-base font-semibold text-sky-700 mb-2">
            Bạn bè
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-5">
              <TouchableOpacity className="items-center">
                <View className="h-16 w-16 rounded-full border-2 border-dashed border-sky-400 items-center justify-center bg-white/50">
                  <Text className="text-2xl text-sky-500">+</Text>
                </View>
                <Text className="mt-2 text-xs text-sky-900">Mới</Text>
              </TouchableOpacity>

              {/* Kiểm tra mảng trước khi map */}
              {Array.isArray(friends) &&
                friends.map((friend) => (
                  <TouchableOpacity
                    key={friend._id}
                    className="items-center"
                    onPress={() =>
                      navigation.navigate("Chat", { userChat: friend })
                    }
                  >
                    <View className="relative">
                      <Image
                        source={{ uri: getAvatarUrl(friend.avatar) }}
                        className="h-16 w-16 rounded-full border-2 border-sky-400"
                      />
                      <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-white items-center justify-center">
                        <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
                      </View>
                    </View>
                    <Text
                      className="mt-2 text-xs text-sky-900"
                      numberOfLines={1}
                      style={{ maxWidth: 70 }}
                    >
                      {friend.firstName || friend.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>

        {/* Chat List */}
        <View className="flex-1 mt-6 px-4 pb-20">
          <Text className="text-base font-semibold text-sky-700 mb-3">
            Đoạn chat gần đây
          </Text>
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#0ea5e9" className="mt-4" />
          ) : filteredChats.length === 0 ? (
            <View className="items-center py-12">
              <Text className="mt-2 text-base text-sky-700 font-semibold">
                Chưa có đoạn chat nào
              </Text>
            </View>
          ) : (
            filteredChats.map((chat) => {
              const receiver = getReceiver(chat);
              const lastMsg = chat.lastMessage || {};
              const isSentByMe = lastMsg.sender === currentUser?._id;
              const messageText = lastMsg.text || "Bắt đầu cuộc trò chuyện";

              return (
                <TouchableOpacity
                  key={chat._id}
                  className="flex-row items-center bg-white rounded-2xl p-4 mb-4 shadow-lg border border-sky-50"
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("Chat", { userChat: receiver })
                  }
                >
                  <View className="relative mr-3">
                    <Image
                      source={{ uri: getAvatarUrl(receiver?.avatar) }}
                      className="h-14 w-14 rounded-full border-2 border-sky-200"
                    />
                    <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-white items-center justify-center">
                      <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-bold text-sky-900"
                      numberOfLines={1}
                    >
                      {receiver?.fullName ||
                        `${receiver?.firstName} ${receiver?.surname}`}
                    </Text>
                    <Text
                      className={`text-sm mt-1 ${isSentByMe ? "text-gray-500" : "text-sky-800 font-medium"}`}
                      numberOfLines={1}
                    >
                      {isSentByMe ? "Bạn: " : ""}
                      {messageText}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400 ml-2 mb-auto">
                    {formatTime(lastMsg.createdAt || chat.updatedAt)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
      <MessengerNavbar />
    </SafeAreaView>
  );
}
