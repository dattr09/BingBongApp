import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker"; // Đã bỏ comment để dùng thật
import { createNewPost } from "../services/postService";
import { API_URL } from "@env";
// Hàm tiện ích: Chuyển path tương đối thành tuyệt đối
const getFullUrl = (path) => {
  if (!path) return null;
  // Nếu đã là link online (firebase, cloudinary...) thì giữ nguyên
  if (path.startsWith("http") || path.startsWith("https")) {
    return path;
  }
  // Nếu là path local (/uploads/...), nối với server
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
const privacyOptions = [
  {
    label: "Công khai",
    value: "public",
    icon: <Ionicons name="earth" size={18} color="#22c55e" />,
  },
  {
    label: "Bạn bè",
    value: "friends",
    icon: <Ionicons name="people" size={18} color="#3b82f6" />,
  },
  {
    label: "Chỉ mình tôi",
    value: "private",
    icon: <Ionicons name="lock-closed" size={18} color="#a3a3a3" />,
  },
];

export default function CreatePostModal({
  visible,
  onClose,
  onPostCreated,
  user,
}) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [privacy, setPrivacy] = useState("public");
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Hàm chọn ảnh thật từ thư viện máy
  const pickImage = async () => {
    // Xin quyền truy cập thư viện
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để đăng bài."
      );
      return;
    }

    // Mở thư viện ảnh
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Chỉ lấy ảnh
      allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh (iOS/Android 13+)
      quality: 0.8, // Nén nhẹ (0.0 - 1.0)
      selectionLimit: 10, // Giới hạn số lượng ảnh được chọn một lúc
    });

    if (!result.canceled) {
      // result.assets là mảng các ảnh đã chọn
      setImages((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const handlePost = async () => {
    // 1. Validate nội dung
    if (!content.trim() && images.length === 0) {
      return Alert.alert("Thông báo", "Bài viết cần nội dung hoặc hình ảnh");
    }

    // 2. Lấy User ID an toàn
    const userId = user?._id || user?.user?._id;

    if (!userId) {
      console.error("❌ Modal Error: User ID missing", user);
      return Alert.alert(
        "Lỗi",
        "Không tìm thấy ID người dùng. Hãy đăng nhập lại."
      );
    }

    setLoading(true);

    // 3. Log kiểm tra trước khi gọi
    console.log("🟦 Modal calling Service:", {
      content,
      type: "User",
      id: userId,
    });

    // 4. Optimistic Update: Tạo post tạm thời để hiển thị ngay
    const optimisticPost = {
      _id: `temp-${Date.now()}`,
      content: content,
      media: images.map(img => img.uri),
      author: displayUser,
      postedById: displayUser,
      postedByType: "User",
      reactions: [],
      comments: [],
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    // Gọi callback ngay để hiển thị post tạm
    if (onPostCreated) {
      onPostCreated(optimisticPost);
    }

    // 5. Gọi Service (ĐÚNG THỨ TỰ: content, images, type, id)
    const result = await createNewPost(content, images, "User", userId);

    setLoading(false);

    if (result.success) {
      setContent("");
      setImages([]);
      setPrivacy("public");
      onClose();
      
      // Thay thế post tạm bằng post thật từ server
      if (onPostCreated && result.data) {
        onPostCreated(result.data, optimisticPost._id);
      }
    } else {
      // Nếu lỗi, xóa post tạm
      if (onPostCreated) {
        onPostCreated(null, optimisticPost._id, true); // true = remove
      }
      Alert.alert("Thất bại", result.message);
    }
  };

  const selectedPrivacy = privacyOptions.find((opt) => opt.value === privacy);
  const displayUser = user?.user || user || {};
  const userName = displayUser.name || displayUser.fullName || "Bạn";
  const userAvatar = displayUser.avatar || "https://i.pravatar.cc/100";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-[#f6f8fa]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-12 pb-4 bg-white rounded-b-3xl shadow-sm z-10">
            <Text className="text-xl font-bold text-blue-600">
              Tạo bài viết
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full bg-gray-100"
            >
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            {/* User Info */}
            <View className="flex-row items-center gap-3 px-6 py-4 bg-white mt-3 mx-4 rounded-2xl shadow-sm z-20">
              <Image
                source={{ uri: userAvatar }}
                className="h-12 w-12 rounded-full border-2 border-blue-200"
              />
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  {userName}
                </Text>
                <Pressable
                  className="flex-row items-center mt-1 px-2 py-1 rounded-lg bg-blue-50 self-start border border-blue-100"
                  onPress={() => setShowPrivacy(!showPrivacy)}
                >
                  {selectedPrivacy.icon}
                  <Text className="ml-2 text-xs text-blue-700 font-semibold">
                    {selectedPrivacy.label}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#3b82f6"
                    style={{ marginLeft: 4 }}
                  />
                </Pressable>
              </View>
            </View>

            {/* Privacy Dropdown */}
            {showPrivacy && (
              <View className="mx-6 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-30">
                {privacyOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    className={`flex-row items-center px-4 py-3 ${privacy === opt.value ? "bg-blue-50" : "bg-white"}`}
                    onPress={() => {
                      setPrivacy(opt.value);
                      setShowPrivacy(false);
                    }}
                  >
                    {opt.icon}
                    <Text
                      className={`ml-3 text-sm ${privacy === opt.value ? "text-blue-600 font-bold" : "text-gray-700"}`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Content Input */}
            <View className="px-4 mt-4">
              <TextInput
                multiline
                placeholder={`Bạn đang nghĩ gì, ${userName.split(" ").pop()} ơi?`}
                value={content}
                onChangeText={setContent}
                className="text-lg text-slate-800 bg-transparent px-2"
                style={{ minHeight: 120, textAlignVertical: "top" }}
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Images */}
            {images.length > 0 && (
              <ScrollView
                horizontal
                className="mt-4 pl-6 pb-4"
                showsHorizontalScrollIndicator={false}
              >
                {images.map((img, idx) => (
                  <View key={idx} className="relative mr-3 mb-2">
                    <Image
                      source={{ uri: img.uri }}
                      className="h-40 w-32 rounded-xl border border-gray-200 bg-gray-100"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveImage(idx)}
                      className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/50 border border-white/20"
                    >
                      <Feather name="x" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                <View className="w-6" />
              </ScrollView>
            )}
          </ScrollView>

          {/* Footer */}
          <View className="px-6 py-4 bg-white border-t border-gray-100 safe-bottom">
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center rounded-xl bg-blue-50 py-3 active:bg-blue-100"
                onPress={pickImage}
              >
                <Ionicons name="images" size={22} color="#2563eb" />
                <Text className="ml-2 font-semibold text-blue-600">
                  Ảnh/Video
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-[2] rounded-xl py-3 shadow-sm flex-row justify-center items-center ${
                  content.trim() || images.length > 0
                    ? "bg-blue-600"
                    : "bg-gray-300"
                }`}
                onPress={handlePost}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="font-bold text-white text-base">
                    Đăng bài
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
