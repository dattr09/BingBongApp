import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import SpinnerLoading from "../../components/SpinnerLoading";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import io from "socket.io-client";
import { useThemeSafe } from "../../utils/themeHelper";
import { API_URL } from "@env";
import {
  getHistoryChat,
  sendMessage,
  getChatIdByUserId,
  getChatIdByTypeId,
  getAIResponse,
} from "../../services/chatService";
import { getFullUrl } from "../../utils/getPic";
import { ZegoSendCallInvitationButton } from "@zegocloud/zego-uikit-prebuilt-call-rn";

const Config = { BACKEND_URL: "http://192.168.1.2:8000" };

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();

  // Lấy thông tin
  const userChat = route.params?.userChat || route.params?.participant || {};
  const groupChat = route.params?.group || null;
  const shopChat = route.params?.shopChat || null;
  const aiChat = route.params?.aiChat || null;
  const chatType = route.params?.chatType || "private";
  const chatId = route.params?.chatId || null;

  const [currentUser, setCurrentUser] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isLoadingAIResponse, setIsLoadingAIResponse] = useState(false);

  const socket = useRef(null);
  const flatListRef = useRef();

  const isAIChat = chatType === "AI" && aiChat;
  const isGroupChat = chatType === "fanpage" && groupChat;
  const isShopChat = chatType === "shop" && shopChat;

  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url === "bingbong-ai" || url === "/bingbong-ai")
      return "https://i.pravatar.cc/300?img=1";
    if (url.startsWith("http")) return url;
    return getFullUrl(url);
  };

  const getChatDisplayInfo = () => {
    if (isAIChat && aiChat) {
      return {
        name: aiChat.name || aiChat.fullName || "BingBong AI",
        avatar: aiChat.avatar || "bingbong-ai",
        isOnline: false,
      };
    }
    if (isShopChat && shopChat) {
      return {
        name: shopChat.name || "Shop",
        avatar: shopChat.avatar,
        isOnline: false,
        followers: shopChat.followers?.length || 0,
      };
    }
    if (isGroupChat && groupChat) {
      return {
        name: groupChat.name || "Group",
        avatar: groupChat.avatar,
        isOnline: false,
        members: groupChat.members?.length || 0,
      };
    }
    return {
      name: userChat.fullName || userChat.firstName || "User",
      avatar: userChat.avatar,
      isOnline: isUserOnline,
    };
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;
        const me = JSON.parse(storedUser);
        setCurrentUser(me);

        const socketUrl = API_URL || Config.BACKEND_URL;
        socket.current = io(socketUrl, { transports: ["websocket"] });

        socket.current.on("connect", () => {
          if (me._id) socket.current.emit("setup", me._id);
        });

        const handleOnlineUsers = (userIds) => {
          if (
            Array.isArray(userIds) &&
            !isGroupChat &&
            !isShopChat &&
            !isAIChat
          ) {
            const userChatId = userChat._id?.toString() || userChat._id;
            setIsUserOnline(userIds.includes(userChatId));
          }
        };

        socket.current.on("getOnlineUsers", handleOnlineUsers);

        let chatRes;
        if (isAIChat) {
          setMessages([
            {
              _id: "welcome-1",
              sender: { _id: "bingbong-ai", fullName: "BingBong AI" },
              text: "Tôi là BingBong AI. Tôi có thể giúp gì cho bạn hôm nay?",
              createdAt: new Date().toISOString(),
            },
          ]);
          setCurrentChatId("bingbong-ai");
        } else if (chatId) {
          chatRes = { success: true, data: { _id: chatId } };
        } else if (isShopChat && shopChat) {
          chatRes = await getChatIdByTypeId({
            type: "shop",
            shopId: shopChat._id,
          });
        } else if (isGroupChat && groupChat) {
          chatRes = await getChatIdByTypeId({
            type: "fanpage",
            fanpageId: groupChat._id,
          });
        } else {
          chatRes = await getChatIdByUserId(userChat._id);
        }

        let activeChatId = null;
        if (!isAIChat && chatRes && chatRes.success && chatRes.data) {
          activeChatId = chatRes.data._id;
          if (activeChatId) setCurrentChatId(activeChatId);
        }

        if (!isAIChat && activeChatId) {
          const historyRes = await getHistoryChat(activeChatId);
          const historyData = historyRes.data?.data || historyRes.data || [];
          if (historyRes.success && Array.isArray(historyData)) {
            setMessages(historyData);
            setTimeout(
              () => flatListRef.current?.scrollToEnd({ animated: false }),
              500
            );
          }
        }
      } catch (error) {
        console.error("Chat Init Error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (socket.current) {
        socket.current.off("getOnlineUsers");
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [
    isAIChat
      ? "ai"
      : isShopChat
        ? shopChat?._id
        : isGroupChat
          ? groupChat?._id
          : userChat._id,
  ]);

  useEffect(() => {
    if (!socket.current || !currentChatId || isAIChat) return;

    const handleReceiveMessage = (newMessage) => {
      const messageChatId = newMessage.chatId?._id || newMessage.chatId;
      const isRelevant = String(messageChatId) === String(currentChatId);

      if (isRelevant) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
        setTimeout(
          () => flatListRef.current?.scrollToEnd({ animated: true }),
          100
        );
      }
    };

    socket.current.on("receiveMessage", handleReceiveMessage);

    return () => {
      if (socket.current) {
        socket.current.off("receiveMessage", handleReceiveMessage);
      }
    };
  }, [currentChatId, isAIChat]);

  const handleSend = async () => {
    if (!messageText.trim() || !currentUser) return;

    if (isAIChat) {
      const textToSend = messageText;
      setMessageText("");
      const userMsg = {
        _id: `user-${Date.now()}`,
        sender: {
          _id: currentUser._id,
          fullName: currentUser.fullName || "You",
        },
        text: textToSend,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );

      setIsLoadingAIResponse(true);
      try {
        const aiRes = await getAIResponse(textToSend);
        if (aiRes.success) {
          const aiMsg = {
            _id: `ai-${Date.now()}`,
            sender: { _id: "bingbong-ai", fullName: "BingBong AI" },
            text:
              aiRes.data ||
              aiRes.message ||
              "I'm sorry, I couldn't process that request.",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            100
          );
        } else {
          Alert.alert("Error", aiRes.message || "Failed to get AI response");
        }
      } catch (error) {
        console.error("AI Response Error:", error);
        Alert.alert("Error", "Failed to get AI response");
      } finally {
        setIsLoadingAIResponse(false);
      }
      return;
    }

    let activeChatId = currentChatId;
    if (!activeChatId) {
      try {
        let retryRes;
        if (isShopChat && shopChat) {
          retryRes = await getChatIdByTypeId({
            type: "shop",
            shopId: shopChat._id,
          });
        } else if (isGroupChat && groupChat) {
          retryRes = await getChatIdByTypeId({
            type: "fanpage",
            fanpageId: groupChat._id,
          });
        } else {
          retryRes = await getChatIdByUserId(userChat._id);
        }
        if (retryRes.success && retryRes.data) {
          activeChatId = retryRes.data._id || retryRes.data;
          setCurrentChatId(activeChatId);
        } else {
          Alert.alert(
            "Error",
            retryRes.message || "Unable to initialize conversation."
          );
          return;
        }
      } catch (e) {
        console.error("Retry failed:", e);
        Alert.alert("Error", "Unable to connect to server.");
        return;
      }
    }

    const textToSend = messageText;
    setMessageText("");

    const optimisticMsg = {
      _id: Math.random().toString(),
      chatId: activeChatId,
      sender: { _id: currentUser._id, avatar: currentUser.avatar },
      text: textToSend,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const formData = new FormData();
      formData.append("text", textToSend);
      formData.append("chatId", activeChatId);

      const res = await sendMessage(formData);

      if (res.success) {
        const realMsg = res.data;
        setMessages((prev) => {
          const filtered = prev.filter((m) => m._id !== optimisticMsg._id);
          const exists = filtered.some((m) => m._id === realMsg._id);
          if (!exists) return [...filtered, realMsg];
          return filtered;
        });
      } else {
        console.error("Send Failed:", res.message);
        Alert.alert("Error", "Failed to send message");
        setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      }
    } catch (error) {
      console.error("Handle Send Error:", error);
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
    }
  };

  const renderItem = ({ item }) => {
    const senderId = item.sender?._id || item.sender;
    const isMe = senderId === currentUser?._id;
    const isAI =
      senderId === "bingbong-ai" || item.sender?._id === "bingbong-ai";
    const senderName =
      item.sender?.fullName ||
      item.sender?.name ||
      (isAI ? "BingBong AI" : "User");

    return (
      <View
        className={`flex-row mb-3 px-3 ${isMe ? "justify-end" : "justify-start"}`}
      >
        {!isMe && (
          <View style={{ marginRight: 8, alignItems: "center" }}>
            {isAI ? (
              <View
                className="h-8 w-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: colors.primary + "20",
                  marginBottom: 2,
                }}
              >
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
            ) : (
              <Image
                source={{ uri: getAvatarUrl(item.sender?.avatar) }}
                className="h-8 w-8 rounded-full"
                style={{ marginBottom: 2 }}
              />
            )}
            {(isGroupChat || isShopChat || isAIChat) && (
              <Text
                className="text-[9px]"
                style={{ color: colors.textTertiary }}
                numberOfLines={1}
              >
                {senderName.split(" ")[0]}
              </Text>
            )}
          </View>
        )}
        <View
          className="max-w-[75%] px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: isMe ? colors.primary : colors.surface,
            borderBottomRightRadius: isMe ? 0 : 16,
            borderBottomLeftRadius: isMe ? 16 : 0,
          }}
        >
          {(isGroupChat || isShopChat || isAIChat) && !isMe && (
            <Text
              className="text-xs font-semibold mb-1"
              style={{ color: colors.primary }}
            >
              {senderName}
            </Text>
          )}
          <Text
            className="text-base"
            style={{ color: isMe ? "#FFFFFF" : colors.text }}
          >
            {item.text}
          </Text>
          <View className="flex-row justify-end items-center mt-1 gap-1">
            <Text
              className="text-[10px]"
              style={{ color: isMe ? "#FFFFFF80" : colors.textTertiary }}
            >
              {formatTime(item.createdAt)}
            </Text>
            {item.isPending && (
              <View
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: isMe
                    ? "#FFFFFF50"
                    : colors.textTertiary + "50",
                }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View
          className="flex-row items-center justify-between px-4 py-3 shadow-sm"
          style={{
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>

          {/* AVATAR & NAME */}
          <View className="flex-row items-center gap-3 flex-1 ml-2">
            {isAIChat ? (
              <View
                className="h-10 w-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor: colors.primary + "20",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
            ) : (
              <Image
                source={{ uri: getAvatarUrl(getChatDisplayInfo().avatar) }}
                className="h-10 w-10 rounded-full"
                style={{ borderWidth: 1, borderColor: colors.border }}
              />
            )}
            <View>
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {getChatDisplayInfo().name}
              </Text>
              <Text
                className="text-xs"
                style={{
                  color: isUserOnline ? colors.success : colors.textTertiary,
                }}
              >
                {isAIChat
                  ? "AI Assistant"
                  : isShopChat
                    ? `${getChatDisplayInfo().followers || 0} followers`
                    : isGroupChat
                      ? `${getChatDisplayInfo().members || 0} members`
                      : getChatDisplayInfo().isOnline
                        ? "Active now"
                        : "Offline"}
              </Text>
            </View>
          </View>

          {/* CALL BUTTONS */}
          {!isAIChat && !isGroupChat && !isShopChat && userChat._id ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 35, height: 35, marginRight: 10 }}>
                <ZegoSendCallInvitationButton
                  invitees={[
                    {
                      userID: userChat._id,
                      userName: userChat.fullName || "User",
                    },
                  ]}
                  isVideoCall={false}
                  resourceID={"zegouikit_call"}
                />
              </View>
              <View style={{ width: 35, height: 35 }}>
                <ZegoSendCallInvitationButton
                  invitees={[
                    {
                      userID: userChat._id,
                      userName: userChat.fullName || "User",
                    },
                  ]}
                  isVideoCall={true}
                  resourceID={"zegouikit_call"}
                />
              </View>
            </View>
          ) : (
            <View style={{ width: 35, height: 35 }} /> // Placeholder để căn chỉnh nếu không phải chat 1-1
          )}
        </View>

        {loading ? (
          <SpinnerLoading />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingVertical: 20 }}
            style={{ backgroundColor: colors.background }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        <View
          className="flex-row items-center px-3 py-3"
          style={{
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <TouchableOpacity className="p-2">
            <Ionicons name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            className="flex-1 rounded-2xl px-4 py-2 max-h-24"
            style={{
              backgroundColor: colors.surface,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
            }}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          {/* --- SỬA LỖI Ở ĐÂY: XÓA STYLE TRÙNG LẶP --- */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || isLoadingAIResponse}
            className="ml-2 p-3 rounded-full"
            style={{
              backgroundColor:
                messageText.trim() && !isLoadingAIResponse
                  ? colors.primary
                  : colors.textTertiary,
            }}
          >
            {isLoadingAIResponse ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" color="white" size={20} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
