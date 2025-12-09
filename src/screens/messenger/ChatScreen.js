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
} from "../../services/chatService";

const Config = { BACKEND_URL: "http://192.168.1.2:8000" };

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  // Lấy thông tin người mình đang chat cùng
  const userChat = route.params?.userChat || route.params?.participant || {};

  const [currentUser, setCurrentUser] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserOnline, setIsUserOnline] = useState(false);

  const socket = useRef(null);
  const flatListRef = useRef();

  // Helper: URL ảnh
  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url.startsWith("http")) return url;
    const baseUrl = API_URL || Config.BACKEND_URL;
    return `${baseUrl}${url}`;
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

        // Listen for online users list to check if userChat is online
        const handleOnlineUsers = (userIds) => {
          if (Array.isArray(userIds)) {
            const userChatId = userChat._id?.toString() || userChat._id;
            setIsUserOnline(userIds.includes(userChatId));
          }
        };

        socket.current.on("getOnlineUsers", handleOnlineUsers);

        // C. Lấy Chat ID từ Backend (dựa trên ID người mình muốn chat)
        const chatRes = await getChatIdByUserId(userChat._id);

        // Xử lý data lồng nhau - backend trả về: { success: true, data: chat } với chat có _id
        let activeChatId = null;

        if (chatRes.success && chatRes.data) {
          // chatRes.data là chat object từ backend, có _id
          activeChatId = chatRes.data._id;
          if (activeChatId) {
            setCurrentChatId(activeChatId);
          }
        }

        // D. Lấy lịch sử tin nhắn (BẮT BUỘC DÙNG CHAT ID)
        if (activeChatId) {
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
  }, [userChat._id]); // Chỉ phụ thuộc vào userChat._id

  // --- LẮNG NGHE SOCKET REAL-TIME ---
  useEffect(() => {
    if (!socket.current || !currentChatId) return;

    const handleReceiveMessage = (newMessage) => {
      // Kiểm tra xem tin nhắn này có thuộc đoạn chat hiện tại không
      const messageChatId = newMessage.chatId?._id || newMessage.chatId;
      const isRelevant = String(messageChatId) === String(currentChatId);

      if (isRelevant) {
        setMessages((prev) => {
          // Tránh duplicate message
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
  }, [currentChatId]); // Lắng nghe khi currentChatId thay đổi

  // --- 2. GỬI TIN NHẮN ---
  const handleSend = async () => {
    if (!messageText.trim() || !currentUser) return;

    let activeChatId = currentChatId;

    // Nếu chưa có ChatId, thử lấy lại lần cuối (phòng hờ)
    if (!activeChatId) {
      try {
        const retryRes = await getChatIdByUserId(userChat._id);
        if (retryRes.success && retryRes.data) {
          activeChatId = retryRes.data._id || retryRes.data;
          setCurrentChatId(activeChatId);
        } else {
          Alert.alert("Error", retryRes.message || "Unable to initialize conversation.");
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
      _id: Math.random().toString(),
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
          // Xóa optimistic message và đảm bảo không có duplicate real message
          const filtered = prev.filter((m) => m._id !== optimisticMsg._id);
          // Kiểm tra xem real message đã có chưa (có thể đã nhận từ socket)
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
    }
  };

  const renderItem = ({ item }) => {
    // Kiểm tra Sender có thể là object (populated) hoặc string ID
    const senderId = item.sender?._id || item.sender;
    const isMe = senderId === currentUser?._id;

    return (
      <View
        className={`flex-row mb-3 px-3 ${isMe ? "justify-end" : "justify-start"}`}
      >
        {!isMe && (
          <Image
            source={{
              uri: getAvatarUrl(item.sender?.avatar || userChat.avatar),
            }}
            className="h-8 w-8 rounded-full mr-2 self-end mb-1"
          />
        )}
        <View
          className="max-w-[75%] px-4 py-3 rounded-2xl"
          style={{
            backgroundColor: isMe ? colors.primary : colors.surface,
            borderBottomRightRadius: isMe ? 0 : 16,
            borderBottomLeftRadius: isMe ? 16 : 0,
          }}
        >
          <Text className="text-base" style={{ color: isMe ? "#FFFFFF" : colors.text }}>
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
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: isMe ? "#FFFFFF50" : colors.textTertiary + "50" }} />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Header */}
        <View 
          className="flex-row items-center justify-between px-4 py-3 shadow-sm"
          style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </TouchableOpacity>
          <View className="flex-row items-center gap-3 flex-1 ml-2">
            <Image
              source={{ uri: getAvatarUrl(userChat.avatar) }}
              className="h-10 w-10 rounded-full"
              style={{ borderWidth: 1, borderColor: colors.border }}
            />
            <View>
              <Text
                className="text-lg font-bold"
                style={{ color: colors.text }}
                numberOfLines={1}
              >
                {userChat.fullName || userChat.firstName || "User"}
              </Text>
              <Text 
                className="text-xs" 
                style={{ color: isUserOnline ? colors.success : colors.textTertiary }}
              >
                {isUserOnline ? "Active now" : "Offline"}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="videocam" size={24} color={colors.primary} />
          </TouchableOpacity>
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
          style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}
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
              borderColor: colors.border 
            }}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim()}
            className="ml-2 p-3 rounded-full"
            style={{ backgroundColor: messageText.trim() ? colors.primary : colors.textTertiary }}
          >
            <Ionicons name="send" color="white" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
