import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";
import io from "socket.io-client";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import MessengerHeader from "../../components/MessengerHeader";
import MessengerNavbar from "../../components/MessengerNavbar";
import { getRecentChats } from "../../services/chatService";
import { getUserProfile } from "../../services/profileService";

export default function MessengerScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [query, setQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socket = useRef(null);
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getReceiver = (conversation) => {
    if (!conversation || !currentUser) return null;

    if (conversation.type === "shop" && conversation.shopId) {
      return conversation.shopId;
    }

    if (conversation.type === "fanpage" && conversation.fanpageId) {
      return conversation.fanpageId;
    }

    if (conversation?.participants) {
      const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
      const currentUserId = currentUser._id || currentUser.user?._id;
      return participants.find((m) => {
        const memberId = m._id || m;
        return memberId && memberId.toString() !== currentUserId?.toString();
      }) || {};
    }

    return {};
  };

  const fetchData = useCallback(async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        const chatRes = await getRecentChats();
        if (chatRes.success) {
          const chats = Array.isArray(chatRes.data) ? chatRes.data : [];
          setConversations(chats);
        } else {
          console.error("Failed to fetch chats:", chatRes.message);
          setConversations([]);
        }

        const profileRes = await getUserProfile();
        if (profileRes.success) {
          const userData = profileRes.data?.data || profileRes.data || {};
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

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;

        const me = JSON.parse(storedUser);
        const socketUrl = API_URL || Config.BACKEND_URL;

        socket.current = io(socketUrl, {
          transports: ["websocket"],
        });

        socket.current.on("connect", () => {
          if (me._id) {
            socket.current.emit("setup", me._id);
          }
        });

        const handleOnlineUsers = (userIds) => {
          if (Array.isArray(userIds)) {
            setOnlineUsers(new Set(userIds));
          }
        };

        socket.current.on("getOnlineUsers", handleOnlineUsers);

        const handleNewMessage = (payload) => {
          const updatedChat = payload.chat;
          if (!updatedChat || !updatedChat._id) {
            fetchData();
            return;
          }

          setConversations((prev) => {
            const index = prev.findIndex((c) => c._id === updatedChat._id);
            if (index !== -1) {
              const newList = [...prev];
              newList[index] = updatedChat;
              const [updated] = newList.splice(index, 1);
              return [updated, ...newList];
            } else {
              return [updatedChat, ...prev];
            }
          });
        };

        const handleGetNewMessage = (payload) => {
          const updatedChat = payload.chat;
          if (!updatedChat || !updatedChat._id) {
            fetchData();
            return;
          }

          setConversations((prev) => {
            const index = prev.findIndex((c) => c._id === updatedChat._id);
            if (index !== -1) {
              const newList = [...prev];
              newList[index] = updatedChat;
              const [updated] = newList.splice(index, 1);
              return [updated, ...newList];
            } else {
              return [updatedChat, ...prev];
            }
          });
        };

        socket.current.on("newMessage", handleNewMessage);
        socket.current.on("getNewMessage", handleGetNewMessage);

        return () => {
          if (socket.current) {
            socket.current.off("newMessage", handleNewMessage);
            socket.current.off("getNewMessage", handleGetNewMessage);
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const isPrivateChat = (chat) => chat.type === "private";
  const inboxChats = safeConversations.filter((chat) => isPrivateChat(chat));
  const filteredChats = inboxChats.filter((chat) => {
    if (!query.trim()) return true;

    const receiver = getReceiver(chat);
    const name = receiver?.fullName || receiver?.firstName || "";

    return name && name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <MessengerHeader />
      <View className="mx-6 mt-4 z-10 shadow-lg">
        <View
          className="flex-row items-center rounded-full px-4 py-2"
          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search friends, messages..."
            placeholderTextColor={colors.textTertiary}
            className="flex-1 text-base"
            style={{ color: colors.text }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Friends List */}
        <View className="mt-6 px-6">
          <Text className="text-base font-semibold mb-2" style={{ color: colors.primary }}>
            Friends
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-5">
              <TouchableOpacity className="items-center">
                <View
                  className="h-16 w-16 rounded-full border-2 border-dashed items-center justify-center"
                  style={{ borderColor: colors.primary, backgroundColor: colors.card + '80' }}
                >
                  <Text className="text-2xl" style={{ color: colors.primary }}>+</Text>
                </View>
                <Text className="mt-2 text-xs" style={{ color: colors.text }}>New</Text>
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
                        source={{ uri: getFullUrl(friend.avatar) || "https://i.pravatar.cc/300?img=1" }}
                        className="h-16 w-16 rounded-full"
                        style={{ borderWidth: 2, borderColor: colors.primary }}
                      />
                      {onlineUsers.has(friend._id?.toString() || friend._id) && (
                        <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full items-center justify-center" style={{ backgroundColor: colors.card }}>
                          <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
                        </View>
                      )}
                    </View>
                    <Text
                      className="mt-2 text-xs"
                      style={{ color: colors.text, maxWidth: 70 }}
                      numberOfLines={1}
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
          <Text className="text-base font-semibold mb-3" style={{ color: colors.primary }}>
            Recent conversations
          </Text>
          {loading && !refreshing ? (
            <SpinnerLoading />
          ) : filteredChats.length === 0 ? (
            <View className="items-center py-12">
              <Text className="mt-2 text-base font-semibold" style={{ color: colors.text }}>
                No conversations yet
              </Text>
            </View>
          ) : (
            filteredChats.map((chat) => {
              const receiver = getReceiver(chat);
              const lastMsg = chat.lastMessage || {};
              const senderId = lastMsg.sender?._id || lastMsg.sender;
              const isSentByMe = senderId === currentUser?._id;
              const messageText = lastMsg.text || "Start a conversation";
              const displayName = receiver?.fullName || `${receiver?.firstName || ""} ${receiver?.surname || ""}`.trim() || "User";
              const navigationParams = { userChat: receiver };

              return (
                <TouchableOpacity
                  key={chat._id}
                  className="flex-row items-center rounded-2xl p-4 mb-4 shadow-lg"
                  style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate("Chat", navigationParams)
                  }
                >
                  <View className="relative mr-3">
                    <Image
                      source={{ uri: getFullUrl(receiver?.avatar) || "https://i.pravatar.cc/300?img=1" }}
                      className="h-14 w-14 rounded-full"
                      style={{ borderWidth: 2, borderColor: colors.primary + '30' }}
                    />
                    {chat.type === "private" && receiver?._id && onlineUsers.has(receiver._id?.toString() || receiver._id) && (
                      <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full items-center justify-center" style={{ backgroundColor: colors.card }}>
                        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.success }} />
                      </View>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base font-bold"
                      style={{ color: colors.text }}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                    <Text
                      className="text-sm mt-1"
                      style={{ color: isSentByMe ? colors.textSecondary : colors.text }}
                      numberOfLines={1}
                    >
                      {isSentByMe ? "You: " : ""}
                      {messageText}
                    </Text>
                  </View>
                  <Text className="text-xs ml-2 mb-auto" style={{ color: colors.textTertiary }}>
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
