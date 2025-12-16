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
  ActivityIndicator,
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
import { View, StyleSheet } from "react-native"; // Import StyleSheet

const Config = { BACKEND_URL: "http://192.168.1.2:8000" };

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  // Lấy thông tin người mình đang chat cùng hoặc group hoặc shop hoặc AI
  const userChat = route.params?.userChat || route.params?.participant || {};
  const groupChat = route.params?.group || null; // For group chat
  const shopChat = route.params?.shopChat || null; // For shop chat
  const aiChat = route.params?.aiChat || null; // For AI chat
  const chatType = route.params?.chatType || "private"; // "private", "fanpage", "shop", or "AI"
  const chatId = route.params?.chatId || null; // Pre-fetched chat ID (optional)

  const [currentUser, setCurrentUser] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [isLoadingAIResponse, setIsLoadingAIResponse] = useState(false);

  const socket = useRef(null);
  const flatListRef = useRef();

  // Determine chat type
  const isAIChat = chatType === "AI" && aiChat;
  const isGroupChat = chatType === "fanpage" && groupChat;
  const isShopChat = chatType === "shop" && shopChat;

  // Helper: URL ảnh
  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url === "bingbong-ai" || url === "/bingbong-ai") {
      // AI chat avatar - use default robot emoji or placeholder
      return "https://i.pravatar.cc/300?img=1";
    }
    if (url.startsWith("http")) return url;
    return getFullUrl(url);
  };

  // Get display info for chat
  const getChatDisplayInfo = () => {
    if (isAIChat && aiChat) {
      return {
        name: aiChat.name || aiChat.fullName || "BingBong AI",
        avatar: aiChat.avatar || "bingbong-ai",
        isOnline: false, // AI doesn't have online status
      };
    }
    if (isShopChat && shopChat) {
      return {
        name: shopChat.name || "Shop",
        avatar: shopChat.avatar,
        isOnline: false, // Shops don't have online status
        followers: shopChat.followers?.length || 0,
      };
    }
    if (isGroupChat && groupChat) {
      return {
        name: groupChat.name || "Group",
        avatar: groupChat.avatar,
        isOnline: false, // Groups don't have online status
        members: groupChat.members?.length || 0,
      };
    }
    return {
      name: userChat.fullName || userChat.firstName || "User",
      avatar: userChat.avatar,
      isOnline: isUserOnline,
    };
  };

  // Helper: Time
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // --- 1. KHỞI TẠO ---
  useEffect(() => {
    const init = async () => {
      try {
        // A. Lấy user hiện tại từ Storage
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;
        const me = JSON.parse(storedUser);
        setCurrentUser(me);

        // B. Kết nối Socket
        const socketUrl = API_URL || Config.BACKEND_URL;
        socket.current = io(socketUrl, {
          transports: ["websocket"],
        });

        // Setup socket với userId khi connect
        socket.current.on("connect", () => {
          if (me._id) {
            socket.current.emit("setup", me._id);
          }
        });

        // Listen for online users list to check if userChat is online (only for private chat)
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

        // C. Lấy Chat ID từ Backend (skip for AI chat)
        let chatRes;
        if (isAIChat) {
          // AI chat doesn't need chat ID, initialize with welcome message
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
          // Use pre-fetched chat ID if available
          chatRes = { success: true, data: { _id: chatId } };
        } else if (isShopChat && shopChat) {
          // Shop chat: use type and shopId
          chatRes = await getChatIdByTypeId({
            type: "shop",
            shopId: shopChat._id,
          });
        } else if (isGroupChat && groupChat) {
          // Group chat: use type and fanpageId
          chatRes = await getChatIdByTypeId({
            type: "fanpage",
            fanpageId: groupChat._id,
          });
        } else {
          // Private chat: use userId
          chatRes = await getChatIdByUserId(userChat._id);
        }

        // Xử lý data lồng nhau - backend trả về: { success: true, data: chat } với chat có _id
        let activeChatId = null;

        if (!isAIChat && chatRes && chatRes.success && chatRes.data) {
          // chatRes.data là chat object từ backend, có _id
          activeChatId = chatRes.data._id;
          if (activeChatId) {
            setCurrentChatId(activeChatId);
          }
        }

        // D. Lấy lịch sử tin nhắn (BẮT BUỘC DÙNG CHAT ID, skip for AI)
        if (!isAIChat && activeChatId) {
          const historyRes = await getHistoryChat(activeChatId);
          const historyData = historyRes.data?.data || historyRes.data || [];

          if (historyRes.success && Array.isArray(historyData)) {
            // Backend sort createdAt: 1 (Cũ -> Mới)
            // FlatList hiển thị từ trên xuống, nên giữ nguyên thứ tự này
            setMessages(historyData);
            // Cuộn xuống dưới cùng sau khi load xong
            setTimeout(
              () => flatListRef.current?.scrollToEnd({ animated: false }),
              500
            );
          }
        } else if (isAIChat) {
          // For AI chat, scroll to end after initial message
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: false }),
            500
          );
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
  ]); // Phụ thuộc vào AI, shop, group hoặc user ID

  // --- LẮNG NGHE SOCKET REAL-TIME --- (skip for AI chat)
  useEffect(() => {
    if (!socket.current || !currentChatId || isAIChat) return;

    const handleReceiveMessage = (newMessage) => {
      // Kiểm tra xem tin nhắn này có thuộc đoạn chat hiện tại không
      // Backend thường trả về chatId object hoặc string ID
      const messageChatId = newMessage.chatId?._id || newMessage.chatId;
      const isRelevant = String(messageChatId) === String(currentChatId);

      if (isRelevant) {
        setMessages((prev) => {
          // Tránh duplicate message (quan trọng khi socket và API cùng trả về)
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
  }, [currentChatId, isAIChat]); // Lắng nghe khi currentChatId thay đổi

  // --- 2. GỬI TIN NHẮN ---
  const handleSend = async () => {
    if (!messageText.trim() || !currentUser) return;

    // Handle AI chat
    if (isAIChat) {
      const textToSend = messageText;
      setMessageText("");

      // Add user message
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

      // Get AI response
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

    // Handle regular chat
    let activeChatId = currentChatId;

    // Nếu chưa có ChatId, thử lấy lại lần cuối (phòng hờ trường hợp chat mới)
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

    // Optimistic UI (Hiện tin nhắn giả trước khi server phản hồi)
    const optimisticMsg = {
      _id: Math.random().toString(), // ID tạm
      chatId: activeChatId,
      sender: { _id: currentUser._id, avatar: currentUser.avatar }, // Populate giả để hiện ảnh
      text: textToSend,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const formData = new FormData();
      // Backend yêu cầu: text, chatId
      formData.append("text", textToSend);
      formData.append("chatId", activeChatId);

      const res = await sendMessage(formData);

      if (res.success) {
        // Thay thế tin nhắn giả bằng tin thật từ server
        const realMsg = res.data;
        setMessages((prev) => {
          // Xóa optimistic message
          const filtered = prev.filter((m) => m._id !== optimisticMsg._id);
          // Kiểm tra xem real message đã có chưa (có thể đã nhận từ socket "receiveMessage")
          const exists = filtered.some((m) => m._id === realMsg._id);
          if (!exists) {
            return [...filtered, realMsg];
          }
          return filtered;
        });
      } else {
        console.error("Send Failed:", res.message);
        Alert.alert("Error", "Failed to send message");
        // Xóa tin nhắn giả nếu lỗi
        setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
      }
    } catch (error) {
      console.error("Handle Send Error:", error);
      // Xóa tin nhắn giả nếu lỗi
      setMessages((prev) => prev.filter((m) => m._id !== optimisticMsg._id));
    }
  };

  // // --- 3. GỌI VIDEO ---
  // const handleVideoCall = () => {
  //   if (!currentUser || !userChat) {
  //     Alert.alert("Lỗi", "Không tìm thấy thông tin người dùng.");
  //     return;
  //   }

  //   // Tạo Call ID duy nhất dựa trên 2 ID người dùng (sort để A gọi B hay B gọi A đều ra cùng ID)
  //   const ids = [currentUser._id, userChat._id].sort();
  //   const callID = `call_${ids[0]}_${ids[1]}`;

  //   // Điều hướng sang màn hình Call
  //   // Lưu ý: Tên màn hình phải khớp với tên đã khai báo trong AppNavigator (ví dụ: "Call")
  //   navigation.navigate("Call", {
  //     callID: callID,
  //     userID: currentUser._id,
  //     userName: currentUser.fullName || currentUser.firstName || "User",
  //   });
  // };

  const renderItem = ({ item }) => {
    // Kiểm tra Sender có thể là object (populated) hoặc string ID
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
        className={`flex-row mb-3 px-3 ${
          isMe ? "justify-end" : "justify-start"
        }`}
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
                source={{
                  uri: getAvatarUrl(item.sender?.avatar),
                }}
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
        {/* Header */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {/* Nút Gọi Thoại (Voice Call) */}
                    <View style={{ width: 35, height: 35, marginRight: 10 }}>
                        <ZegoSendCallInvitationButton
                            invitees={[{ userID: userChat._id, userName: userChat.fullName || "User" }]}
                            isVideoCall={false} // False = Gọi thoại
                            resourceID={"zegouikit_call"} // Tài nguyên mặc định
                        />
                    </View>

                    {/* Nút Gọi Video (Video Call) */}
                    <View style={{ width: 35, height: 35 }}>
                        <ZegoSendCallInvitationButton
                            invitees={[{ userID: userChat._id, userName: userChat.fullName || "User" }]}
                            isVideoCall={true} // True = Gọi Video
                            resourceID={"zegouikit_call"}
                        />
                    </View>
                </View>

        {/* Chat List */}
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

        {/* Input */}
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
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || isLoadingAIResponse}
            className="ml-2 p-3 rounded-full"
            style={{
              backgroundColor: messageText.trim()
                ? colors.primary
                : colors.textTertiary,
            }}
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
