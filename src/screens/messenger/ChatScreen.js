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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native";
import io from "socket.io-client";
import { API_URL } from "@env";
import { getHistoryChat, sendMessage } from "../../services/chatService";

const Config = { BACKEND_URL: "http://192.168.1.2:8000" };

export default function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const userChat = route.params?.userChat || route.params?.participant || {};

  const [currentUser, setCurrentUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const socket = useRef(null);
  const flatListRef = useRef();

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

  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!storedUser) return;
        const me = JSON.parse(storedUser);
        setCurrentUser(me);

        const socketUrl = API_URL || Config.BACKEND_URL;
        // FIX: Thêm transports để kết nối ổn định hơn trên Android
        socket.current = io(socketUrl, { transports: ["websocket"] });
        socket.current.emit("addUser", me._id);

        if (userChat._id) {
          const res = await getHistoryChat(userChat._id);
          // FIX: Đảm bảo messages là mảng
          if (res.success && Array.isArray(res.data)) {
            setMessages(res.data);
          }
        }
      } catch (error) {
        console.error("Chat Init Error:", error);
      } finally {
        setLoading(false);
      }
    };

    init();

    if (socket.current) {
      socket.current.on("getMessage", (incomingMsg) => {
        if (incomingMsg.sender === userChat._id) {
          setMessages((prev) => [...prev, incomingMsg]);
          setTimeout(
            () => flatListRef.current?.scrollToEnd({ animated: true }),
            100
          );
        }
      });
    }

    return () => {
      if (socket.current) socket.current.disconnect();
    };
  }, [userChat._id]);

  const handleSend = async () => {
    if (!messageText.trim() || !currentUser) return;

    const textToSend = messageText;
    setMessageText("");

    const optimisticMsg = {
      _id: Math.random().toString(),
      sender: currentUser._id,
      receiver: userChat._id,
      content: textToSend,
      text: textToSend,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    // FIX: Đảm bảo messages là mảng trước khi spread
    setMessages((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      optimisticMsg,
    ]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const formData = new FormData();
      // FIX: Ép kiểu String cho ID để tránh lỗi 500 từ backend
      formData.append("senderId", String(currentUser._id));
      formData.append("receiverId", String(userChat._id));
      formData.append("content", textToSend);

      socket.current.emit("sendMessage", {
        senderId: currentUser._id,
        receiverId: userChat._id,
        text: textToSend,
      });

      const res = await sendMessage(formData);

      if (res.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === optimisticMsg._id ? { ...m, isPending: false } : m
          )
        );
      } else {
        console.error("Send Message API Failed:", res.message);
      }
    } catch (error) {
      console.error("Handle Send Error:", error);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender === currentUser?._id;
    const content = item.content || item.text || "";

    return (
      <View
        className={`flex-row ${isMe ? "justify-end" : "justify-start"} mb-3`}
      >
        {!isMe && (
          <Image
            source={{ uri: getAvatarUrl(userChat.avatar) }}
            className="h-8 w-8 rounded-full mr-2 self-end mb-1"
          />
        )}
        <View
          className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMe ? "bg-sky-500 rounded-br-none" : "bg-white shadow-sm border border-sky-50 rounded-bl-none"}`}
        >
          <Text className={`text-base ${isMe ? "text-white" : "text-sky-900"}`}>
            {content}
          </Text>
          <View className="flex-row justify-end items-center mt-1 gap-1">
            <Text
              className={`text-[10px] ${isMe ? "text-sky-100" : "text-gray-400"}`}
            >
              {formatTime(item.createdAt)}
            </Text>
            {isMe && item.isPending && (
              <Ionicons name="time-outline" size={10} color="#e0f2fe" />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between bg-white px-4 py-3 shadow-sm border-b border-sky-100">
          <TouchableOpacity
            className="p-2 rounded-full bg-sky-50 active:bg-sky-100"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="#0ea5e9" />
          </TouchableOpacity>
          <View className="flex-row items-center gap-3 flex-1 ml-2">
            <View className="relative">
              <Image
                source={{ uri: getAvatarUrl(userChat.avatar) }}
                className="h-10 w-10 rounded-full border border-sky-200"
              />
              <View
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${userChat.online ? "bg-green-500" : "bg-gray-300"}`}
              />
            </View>
            <View>
              <Text
                className="text-lg font-bold text-sky-900"
                numberOfLines={1}
              >
                {userChat.fullName || userChat.firstName || "Người dùng"}
              </Text>
              <Text className="text-xs text-gray-500">
                {userChat.online ? "Đang hoạt động" : "Ngoại tuyến"}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-2 rounded-full bg-sky-50 mx-1">
            <Ionicons name="call-outline" size={22} color="#0ea5e9" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 rounded-full bg-sky-50">
            <Ionicons name="videocam-outline" size={22} color="#0ea5e9" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#0ea5e9" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || index.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            renderItem={renderItem}
          />
        )}

        {/* Input */}
        <View className="flex-row items-center bg-white px-3 py-3 border-t border-sky-100 pb-6">
          <TouchableOpacity className="p-2 rounded-full bg-gray-100 mr-2">
            <Ionicons name="add" size={24} color="#0ea5e9" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-gray-50 rounded-2xl px-4 py-2 text-sky-900 border border-gray-200 max-h-24"
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94a3b8"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim()}
            className={`ml-2 rounded-full p-3 shadow-md ${messageText.trim() ? "bg-sky-500" : "bg-gray-200"}`}
          >
            <Ionicons name="send" color="white" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
