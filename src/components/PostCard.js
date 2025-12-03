import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableHighlight, // Thay Pressable bằng TouchableHighlight
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { reactToPost, addComment } from "../services/postService";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("https")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function PostCard({ post, currentUser }) {
  if (!post) return null;

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsCount, setCommentsCount] = useState(
    post.comments?.length || 0
  );

  const [reactions, setReactions] = useState(post.reactions || []);
  const currentUserId = currentUser?._id || currentUser?.user?._id;
  const isLikedInit = reactions.some(
    (r) => r.user?._id === currentUserId || r.user === currentUserId
  );
  const [isLiked, setIsLiked] = useState(isLikedInit);

  // Cấu hình màu khi bấm nút (Xám nhạt)
  const UNDERLAY_COLOR = "#f3f4f6";

  const author = post.author || post.postedById || {};
  const authorName = author.fullName || author.name || "Người dùng ẩn danh";
  const authorAvatar = author.avatar
    ? getFullUrl(author.avatar)
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
      setIsLiked(!newIsLiked);
      setReactions(post.reactions || []);
    }
  };

  const handleSendComment = async () => {
    if (!commentContent.trim()) return;
    setIsSubmittingComment(true);
    const result = await addComment(post._id, commentContent);
    setIsSubmittingComment(false);

    if (result.success) {
      setCommentContent("");
      setShowCommentModal(false);
      setCommentsCount((prev) => prev + 1);
    } else {
      Alert.alert("Thất bại", result.message || "Không thể gửi bình luận");
    }
  };

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
        <TouchableHighlight
          underlayColor={UNDERLAY_COLOR}
          className="p-2 rounded-full"
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#64748b" />
        </TouchableHighlight>
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
              <TouchableHighlight
                key={idx}
                className={`${widthClass} ${heightClass} p-1`}
                underlayColor="transparent"
                onPress={() => openImageModal(idx)}
              >
                <View>
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
                </View>
              </TouchableHighlight>
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
        <TouchableHighlight
          className="flex-1 rounded-lg"
          underlayColor={UNDERLAY_COLOR}
          onPress={handleLike}
        >
          <View className="flex-row items-center justify-center gap-2 py-3">
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
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          className="flex-1 rounded-lg"
          underlayColor={UNDERLAY_COLOR}
          onPress={() => setShowCommentModal(true)}
        >
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
            <Text className="text-sm font-medium text-slate-600">
              Bình luận
            </Text>
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          className="flex-1 rounded-lg"
          underlayColor={UNDERLAY_COLOR}
        >
          <View className="flex-row items-center justify-center gap-2 py-3">
            <Ionicons name="share-social-outline" size={20} color="#64748b" />
            <Text className="text-sm font-medium text-slate-600">Chia sẻ</Text>
          </View>
        </TouchableHighlight>
      </View>

      {/* MODALS */}
      <Modal
        visible={showImageModal}
        transparent
        onRequestClose={closeImageModal}
      >
        <View className="flex-1 bg-black/95 justify-center items-center relative">
          <TouchableHighlight
            onPress={closeImageModal}
            underlayColor="#333"
            className="absolute top-12 right-5 z-50 p-2 bg-gray-800/50 rounded-full"
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableHighlight>
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
              <TouchableHighlight
                onPress={prevImage}
                underlayColor="#333"
                className="p-3 bg-gray-800/80 rounded-full"
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableHighlight>
              <TouchableHighlight
                onPress={nextImage}
                underlayColor="#333"
                className="p-3 bg-gray-800/80 rounded-full"
              >
                <Ionicons name="chevron-forward" size={28} color="white" />
              </TouchableHighlight>
            </View>
          )}
        </View>
      </Modal>

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
          <TouchableHighlight
            className="flex-1"
            underlayColor="transparent"
            onPress={() => setShowCommentModal(false)}
          >
            <View />
          </TouchableHighlight>
          <View className="bg-white rounded-t-3xl p-4 pb-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <Text className="text-lg font-bold text-gray-800">Bình luận</Text>
              <TouchableHighlight
                onPress={() => setShowCommentModal(false)}
                underlayColor="#e5e7eb"
                className="bg-gray-100 p-1 rounded-full"
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableHighlight>
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
              <TouchableHighlight
                className={`p-3 rounded-full ${!commentContent.trim() ? "bg-gray-200" : "bg-blue-600"}`}
                onPress={handleSendComment}
                disabled={!commentContent.trim() || isSubmittingComment}
                underlayColor="#2563eb"
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
              </TouchableHighlight>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
