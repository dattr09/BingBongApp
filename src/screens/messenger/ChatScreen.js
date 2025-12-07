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
  // Lấy thông tin người mình đang chat cùng
  const userChat = route.params?.userChat || route.params?.participant || {};

  const [currentUser, setCurrentUser] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

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
          console.log("[SOCKET CONNECTED]", socket.current.id);
          if (me._id) {
            socket.current.emit("setup", me._id);
            console.log("✅ Socket setup with userId:", me._id);
          }
        });

        // C. Lấy Chat ID từ Backend (dựa trên ID người mình muốn chat)
        console.log("🔍 Finding chat with:", userChat._id);
        const chatRes = await getChatIdByUserId(userChat._id);

        // Xử lý data lồng nhau - backend trả về: { success: true, data: chat } với chat có _id
        let activeChatId = null;

        if (chatRes.success && chatRes.data) {
          // chatRes.data là chat object từ backend, có _id
          activeChatId = chatRes.data._id;
          if (activeChatId) {
            setCurrentChatId(activeChatId);
            console.log("✅ Chat ID Found:", activeChatId);
          } else {
            console.log("⚠️ Chat object không có _id:", chatRes.data);
          }
        } else {
          console.log("⚠️ Chat ID not found (New conversation):", chatRes.message);
          // Backend tự tạo chat mới nếu chưa có, nên nếu không có thì có thể là lỗi
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
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [userChat._id]); // Chỉ phụ thuộc vào userChat._id

  // --- LẮNG NGHE SOCKET REAL-TIME ---
  useEffect(() => {
    if (!socket.current || !currentChatId) return;

    const handleReceiveMessage = (newMessage) => {
      console.log("📩 Socket received:", newMessage);

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
          console.log("✅ Retry Chat ID Found:", activeChatId);
        } else {
          Alert.alert("Lỗi", retryRes.message || "Không thể khởi tạo cuộc trò chuyện.");
          return;
        }
      } catch (e) {
        console.error("Retry failed:", e);
        Alert.alert("Lỗi", "Không thể kết nối đến server.");
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

      console.log("🚀 Sending to Backend:", {
        text: textToSend,
        chatId: activeChatId,
      });

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
        Alert.alert("Lỗi", "Gửi tin nhắn thất bại");
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
          className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMe ? "bg-blue-600 rounded-br-none" : "bg-gray-200 rounded-bl-none"}`}
        >
          <Text className={`text-base ${isMe ? "text-white" : "text-black"}`}>
            {item.text}
          </Text>
          <View className="flex-row justify-end items-center mt-1 gap-1">
            <Text
              className={`text-[10px] ${isMe ? "text-blue-100" : "text-gray-500"}`}
            >
              {formatTime(item.createdAt)}
            </Text>
            {item.isPending && (
              <View className="w-3 h-3 rounded-full bg-white/50" />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm border-b border-gray-100">
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#0ea5e9" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-3 flex-1 ml-2">
            <Image
              source={{ uri: getAvatarUrl(userChat.avatar) }}
              className="h-10 w-10 rounded-full border border-gray-200"
            />
            <View>
              <Text
                className="text-lg font-bold text-gray-800"
                numberOfLines={1}
              >
                {userChat.fullName || userChat.firstName || "Người dùng"}
              </Text>
              <Text className="text-xs text-green-600">Đang hoạt động</Text>
            </View>
          </View>
          <TouchableOpacity className="p-2">
            <Ionicons name="videocam" size={24} color="#0ea5e9" />
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
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            onLayout={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input */}
        <View className="flex-row items-center bg-white px-3 py-3 border-t border-gray-100">
          <TouchableOpacity className="p-2">
            <Ionicons name="add-circle" size={28} color="#0ea5e9" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-black border border-gray-200 max-h-24"
            placeholder="Nhập tin nhắn..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim()}
            className={`ml-2 p-3 rounded-full ${messageText.trim() ? "bg-blue-600" : "bg-gray-200"}`}
          >
            <Ionicons name="send" color="white" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
