import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// --- CẤU HÌNH DOMAIN BACKEND ---
// QUAN TRỌNG: Thay đổi URL này cho đúng với Server của bạn
// - Nếu chạy máy ảo Android: dùng "http://10.0.2.2:5000" (hoặc port server của bạn)
// - Nếu chạy trên điện thoại thật (cùng Wifi): dùng IP LAN máy tính, VD: "http://192.168.1.15:5000"
const API_BASE_URL = "http://192.168.1.2:8000";

// Hàm tiện ích: Chuyển path tương đối thành tuyệt đối
const getFullUrl = (path) => {
  if (!path) return null;
  // Nếu đã là link online (firebase, cloudinary...) thì giữ nguyên
  if (path.startsWith("http") || path.startsWith("https")) {
    return path;
  }
  // Nếu là path local (/uploads/...), nối với server
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const emotions = [
  {
    id: 1,
    name: "Like",
    icon: { uri: "https://img.icons8.com/emoji/48/000000/thumbs-up.png" },
    color: "blue",
  },
  {
    id: 2,
    name: "Love",
    icon: { uri: "https://img.icons8.com/emoji/48/000000/red-heart.png" },
    color: "red",
  },
  {
    id: 3,
    name: "Haha",
    icon: {
      uri: "https://img.icons8.com/emoji/48/000000/face-with-tears-of-joy.png",
    },
    color: "yellow",
  },
];

export default function PostCard({ post }) {
  if (!post) return null;

  const [showEmotionBar, setShowEmotionBar] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // ---------------------------------------------------------
  // 1. XỬ LÝ DỮ LIỆU TỪ BACKEND
  // ---------------------------------------------------------

  // Author & PostedBy
  const author = post.author || post.postedById || {};
  const authorName = author.fullName || author.name || "Người dùng ẩn danh";

  // XỬ LÝ AVATAR: Nối domain vào path
  const rawAvatar = author.avatar;
  const authorAvatar = rawAvatar
    ? getFullUrl(rawAvatar)
    : "https://i.pravatar.cc/150?img=3"; // Ảnh fallback nếu không có avatar

  // Content
  const postContent = post.content || post.description || "";

  // XỬ LÝ MEDIA/IMAGES: JSON của bạn trả về 'media', code cũ là 'images'
  const rawMedia = post.media || post.images || [];

  // Chuyển đổi tất cả ảnh sang URL tuyệt đối
  const postImages = Array.isArray(rawMedia)
    ? rawMedia
        .map((img) => {
          // Nếu img là string path -> getFullUrl
          if (typeof img === "string") return getFullUrl(img);
          // Nếu img là object { url: ... } -> getFullUrl(img.url)
          return getFullUrl(img?.url);
        })
        .filter(Boolean) // Lọc bỏ giá trị null/undefined
    : [];

  // ---------------------------------------------------------
  // 2. LOGIC SỰ KIỆN
  // ---------------------------------------------------------
  const openImageModal = (idx) => {
    setSelectedImageIdx(idx);
    setShowImageModal(true);
  };

  const closeImageModal = () => setShowImageModal(false);

  const nextImage = () => {
    setSelectedImageIdx((prev) =>
      prev < postImages.length - 1 ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    setSelectedImageIdx((prev) =>
      prev > 0 ? prev - 1 : postImages.length - 1
    );
  };

  // ---------------------------------------------------------
  // 3. RENDER UI
  // ---------------------------------------------------------
  return (
    <View className="w-full bg-white rounded-3xl shadow-sm mb-4 overflow-hidden border border-sky-100 mx-1">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 pt-5 pb-3 bg-gradient-to-r from-sky-50 to-white">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: authorAvatar }}
            className="h-12 w-12 rounded-full border border-sky-200 bg-gray-200"
            onError={(e) => console.log("Lỗi tải avatar:", e.nativeEvent.error)}
          />
          <View>
            <Text className="text-base font-bold text-slate-800">
              {authorName}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Text className="text-xs text-gray-400 font-medium">
                {post.createdAt
                  ? new Date(post.createdAt).toLocaleString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Vừa xong"}
              </Text>
              <Ionicons name="earth" size={12} color="#94a3b8" />
            </View>
          </View>
        </View>
        <TouchableOpacity className="p-2">
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {postContent ? (
        <Text className="px-5 py-2 text-base text-slate-700 leading-6">
          {postContent}
        </Text>
      ) : null}

      {/* IMAGES GRID */}
      {postImages.length > 0 && (
        <View className="flex-row flex-wrap mt-2 px-1">
          {postImages.slice(0, 4).map((imgUrl, idx) => {
            const isSingle = postImages.length === 1;
            const widthClass = isSingle ? "w-full" : "w-1/2";
            const heightClass = isSingle ? "h-64" : "h-40";

            return (
              <TouchableOpacity
                key={idx}
                className={`${widthClass} ${heightClass} p-1`}
                activeOpacity={0.9}
                onPress={() => openImageModal(idx)}
              >
                <Image
                  source={{ uri: imgUrl }}
                  className="w-full h-full rounded-xl bg-gray-100"
                  resizeMode="cover"
                />
                {idx === 3 && postImages.length > 4 && (
                  <View className="absolute inset-1 bg-black/50 rounded-xl flex items-center justify-center">
                    <Text className="text-2xl font-bold text-white">
                      +{postImages.length - 4}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* STATS */}
      <View className="flex-row items-center justify-between px-5 py-3 mt-1">
        <View className="flex-row items-center gap-1">
          <View className="bg-blue-500 rounded-full p-1 border border-white">
            <Ionicons name="thumbs-up" size={10} color="white" />
          </View>
          <Text className="text-sm text-gray-500 ml-1">
            {post.reactions?.length || 0}
          </Text>
        </View>
        <Text className="text-sm text-gray-500">
          {post.comments?.length || 0} bình luận
        </Text>
      </View>

      {/* ACTION BUTTONS */}
      <View className="flex-row border-t border-gray-100 mx-2 mb-2">
        <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-3">
          <Ionicons name="thumbs-up-outline" size={20} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-3">
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Bình luận</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-3">
          <Ionicons name="share-social-outline" size={20} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {/* IMAGE MODAL */}
      <Modal
        visible={showImageModal}
        transparent
        onRequestClose={closeImageModal}
      >
        <View className="flex-1 bg-black/95 justify-center items-center relative">
          <TouchableOpacity
            onPress={closeImageModal}
            className="absolute top-12 right-5 z-50 p-2 bg-gray-800/50 rounded-full"
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          <View className="w-full h-3/4 justify-center">
            {postImages.length > 0 && (
              <Image
                source={{ uri: postImages[selectedImageIdx] }}
                className="w-full h-full"
                resizeMode="contain"
              />
            )}
          </View>

          {postImages.length > 1 && (
            <View className="absolute bottom-12 flex-row w-full justify-between px-8">
              <TouchableOpacity
                onPress={prevImage}
                className="p-3 bg-gray-800/80 rounded-full"
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextImage}
                className="p-3 bg-gray-800/80 rounded-full"
              >
                <Ionicons name="chevron-forward" size={28} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}
