import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { reactToPost, addComment } from "../services/postService"; // Thêm import addComment
import { getFullUrl } from "../utils/getPic";
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

export default function PostCard({ post, currentUser }) {
  if (!post) return null;

  // --- STATE UI ---
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // --- STATE COMMENT ---
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(
    post.comments?.length || 0
  );

  // --- STATE REACTIONS ---
  const [reactions, setReactions] = useState(post.reactions || []);
  const currentUserId = currentUser?._id || currentUser?.user?._id;
  const isLikedInit = reactions.some(
    (r) => r.user?._id === currentUserId || r.user === currentUserId
  );
  const [isLiked, setIsLiked] = useState(isLikedInit);

  // --- XỬ LÝ DỮ LIỆU ---
  const author = post.author || post.postedById || {};
  const authorName = author.fullName || author.name || "Người dùng ẩn danh";
  const rawAvatar = author.avatar;
  const authorAvatar = rawAvatar
    ? getFullUrl(rawAvatar)
    : "https://i.pravatar.cc/150?img=3";
  const postContent = post.content || post.description || "";
  const rawMedia = post.media || post.images || [];

  const postImages = Array.isArray(rawMedia)
    ? rawMedia
        .map((img) => {
          if (typeof img === "string") return getFullUrl(img);
          return getFullUrl(img?.url);
        })
        .filter(Boolean)
    : [];

  // --- LOGIC HANDLE LIKE ---
  const handleLike = async () => {
    const type = "Like";
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);

    let newReactions = [...reactions];
    if (newIsLiked) {
      newReactions.push({ user: { _id: currentUserId }, type: "Like" });
    } else {
      newReactions = newReactions.filter(
        (r) => r.user?._id !== currentUserId && r.user !== currentUserId
      );
    }
    setReactions(newReactions);

    const result = await reactToPost(post._id, type);

    if (!result.success) {
      console.log("Lỗi like:", result.message);
      setIsLiked(!newIsLiked);
      setReactions(post.reactions || []);
    }
  };

  // --- LOGIC HANDLE COMMENT ---
  const handleSendComment = async () => {
    if (!commentContent.trim()) return;
    setIsSubmittingComment(true);

    // Gọi API addComment
    const result = await addComment(post._id, commentContent);

    setIsSubmittingComment(false);

    if (result.success) {
      // Thành công: Reset input, đóng modal, tăng số comment
      setCommentContent("");
      setShowCommentModal(false);
      setCommentsCount((prev) => prev + 1);
      // Alert.alert("Thành công", "Đã gửi bình luận!");
    } else {
      Alert.alert("Thất bại", result.message || "Không thể gửi bình luận");
    }
  };

  // --- IMAGE MODAL LOGIC ---
  const openImageModal = (idx) => {
    setSelectedImageIdx(idx);
    setShowImageModal(true);
  };
  const closeImageModal = () => setShowImageModal(false);
  const nextImage = () =>
    setSelectedImageIdx((prev) =>
      prev < postImages.length - 1 ? prev + 1 : 0
    );
  const prevImage = () =>
    setSelectedImageIdx((prev) =>
      prev > 0 ? prev - 1 : postImages.length - 1
    );

  return (
    <View className="w-full bg-white rounded-3xl shadow-sm mb-4 overflow-hidden border border-sky-100 mx-1">
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 pt-5 pb-3 bg-gradient-to-r from-sky-50 to-white">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: authorAvatar }}
            className="h-12 w-12 rounded-full border border-sky-200 bg-gray-200"
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

      {/* IMAGES */}
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
          {reactions.length > 0 && (
            <View className="bg-blue-500 rounded-full p-1 border border-white">
              <Ionicons name="thumbs-up" size={10} color="white" />
            </View>
          )}
          <Text className="text-sm text-gray-500 ml-1">
            {reactions.length} lượt thích
          </Text>
        </View>
        <Text className="text-sm text-gray-500">{commentsCount} bình luận</Text>
      </View>

      {/* ACTION BUTTONS */}
      <View className="flex-row border-t border-gray-100 mx-2 mb-2">
        {/* NÚT LIKE */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 py-3"
          onPress={handleLike}
        >
          <Ionicons
            name={isLiked ? "thumbs-up" : "thumbs-up-outline"}
            size={20}
            color={isLiked ? "#3b82f6" : "#64748b"}
          />
          <Text
            className={`text-sm font-medium ${isLiked ? "text-blue-500" : "text-slate-600"}`}
          >
            Thích
          </Text>
        </TouchableOpacity>

        {/* NÚT BÌNH LUẬN - Mở Modal */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center gap-2 py-3"
          onPress={() => setShowCommentModal(true)}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Bình luận</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-3">
          <Ionicons name="share-social-outline" size={20} color="#64748b" />
          <Text className="text-sm font-medium text-slate-600">Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {/* --- IMAGE MODAL --- */}
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

      {/* --- COMMENT MODAL --- */}
      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/50"
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowCommentModal(false)}
          />
          <View className="bg-white rounded-t-3xl p-4 pb-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <Text className="text-lg font-bold text-gray-800">Bình luận</Text>
              <TouchableOpacity
                onPress={() => setShowCommentModal(false)}
                className="bg-gray-100 p-1 rounded-full"
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center gap-3">
              <TextInput
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-800"
                placeholder="Viết bình luận..."
                value={commentContent}
                onChangeText={setCommentContent}
                multiline
                autoFocus
                maxLength={500}
              />
              <TouchableOpacity
                className={`p-3 rounded-full ${!commentContent.trim() ? "bg-gray-200" : "bg-blue-600"}`}
                onPress={handleSendComment}
                disabled={!commentContent.trim() || isSubmittingComment}
              >
                {isSubmittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={!commentContent.trim() ? "#999" : "#fff"}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
