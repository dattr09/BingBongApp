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

export default function StoriesScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [query, setQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
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
      }
    } catch (error) {
      console.error("StoriesScreen Error:", error);
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
  const isGroupOrShopChat = (chat) =>
    chat.type === "fanpage" ||
    chat.type === "shop" ||
    chat.type === "shop_channel" ||
    chat.type === "group" ||
    chat.type === "AI";

  const storiesChats = safeConversations.filter((chat) => isGroupOrShopChat(chat));
  const getFilteredChats = (chats) => {
    return chats.filter((chat) => {
      if (!query.trim()) return true;

      const receiver = getReceiver(chat);
      let name = "";

      if (chat.type === "shop" && receiver) {
        name = receiver.name || "";
      } else if (chat.type === "fanpage" && receiver) {
        name = receiver.name || "";
      } else if (chat.type === "AI") {
        name = chat.groupName || "BingBong AI";
      } else {
        name = receiver?.fullName || receiver?.firstName || "";
      }

      return name && name.toLowerCase().includes(query.toLowerCase());
    });
  };

  const filteredChats = getFilteredChats(storiesChats);

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
            placeholder="Search groups, shops..."
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
        {/* Chat List */}
        <View className="flex-1 mt-6 px-4 pb-20">
          <Text className="text-base font-semibold mb-3" style={{ color: colors.primary }}>
            Groups & Shops
          </Text>
          {loading && !refreshing ? (
            <SpinnerLoading />
          ) : filteredChats.length === 0 ? (
            <View className="items-center py-12">
              <Text className="mt-2 text-base font-semibold" style={{ color: colors.text }}>
                No groups or shops yet
              </Text>
            </View>
          ) : (
            filteredChats.map((chat) => {
              const receiver = getReceiver(chat);
              const lastMsg = chat.lastMessage || {};
              const senderId = lastMsg.sender?._id || lastMsg.sender;
              const isSentByMe = senderId === currentUser?._id;
              const messageText = lastMsg.text || "Start a conversation";
              let displayName = "";
              let navigationParams = {};

              if (chat.type === "AI") {
                displayName = chat.groupName || "BingBong AI";
                navigationParams = {
                  aiChat: {
                    _id: "bingbong-ai",
                    avatar: "bingbong-ai",
                    fullName: "BingBong AI",
                    name: "BingBong AI",
                  },
                  chatType: "AI",
                };
              } else if (chat.type === "shop" && receiver) {
                displayName = receiver.name || "Shop";
                navigationParams = {
                  shopChat: receiver,
                  chatType: "shop",
                  chatId: chat._id,
                };
              } else if (chat.type === "fanpage" && receiver) {
                displayName = receiver.name || "Group";
                navigationParams = {
                  group: receiver,
                  chatType: "fanpage",
                  chatId: chat._id,
                };
              } else {
                displayName = receiver?.fullName || `${receiver?.firstName || ""} ${receiver?.surname || ""}`.trim() || "User";
                navigationParams = { userChat: receiver };
              }

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
                    {chat.type === "AI" ? (
                      <View
                        className="h-14 w-14 rounded-full items-center justify-center"
                        style={{
                          backgroundColor: colors.primary + "20",
                          borderWidth: 2,
                          borderColor: colors.primary + "30",
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>🤖</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: getFullUrl(receiver?.avatar) || "https://i.pravatar.cc/300?img=1" }}
                        className="h-14 w-14 rounded-full"
                        style={{ borderWidth: 2, borderColor: colors.primary + '30' }}
                      />
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

