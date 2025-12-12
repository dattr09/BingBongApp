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
import * as ImagePicker from "expo-image-picker";
import { createNewPost } from "../services/postService";
import { useThemeSafe } from "../utils/themeHelper";
import { getUserBadgeInventory } from "../services/badgeService";
import { getFullUrl } from "../utils/getPic";

export default function CreatePostModal({
  visible,
  onClose,
  onPostCreated,
  user,
  postedByType = "User",
  postedById = null,
  postedBy = null,
}) {
  const { colors } = useThemeSafe();
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [privacy, setPrivacy] = useState("public");
  const [showPrivacy, setShowPrivacy] = useState(false);

  const displayUser = user?.user || user || {};
  
  const isGroupPost = postedByType === "Group" && postedBy;
  const displayName = isGroupPost 
    ? (postedBy.name || "Group")
    : (displayUser.name || displayUser.fullName || "You");
  const displayAvatar = isGroupPost
    ? (postedBy.avatar ? getFullUrl(postedBy.avatar) : "https://i.pravatar.cc/100")
    : (displayUser.avatar ? getFullUrl(displayUser.avatar) : "https://i.pravatar.cc/100");

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để đăng bài."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets]);
    }
  };

  const handleRemoveImage = (idx) =>
    setImages((prev) => prev.filter((_, i) => i !== idx));

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      return Alert.alert("Notice", "Post needs content or images");
    }

    const userId = user?._id || user?.user?._id;
    const targetId = postedById || userId;

    if (!userId) {
      return Alert.alert(
        "Lỗi",
        "User ID not found. Please login again."
      );
    }

    if (!targetId) {
      return Alert.alert(
        "Lỗi",
        "Target ID not found."
      );
    }

    setLoading(true);

    let badgeInventory = displayUser.badgeInventory || user?.badgeInventory || [];

    const tempPostId = `temp-${Date.now()}`;
    const optimisticPost = {
      _id: tempPostId,
      content: content,
      media: images.map(img => img.uri),
      author: {
        ...displayUser,
        badgeInventory: badgeInventory,
      },
      postedById: isGroupPost ? postedBy : {
        ...displayUser,
        badgeInventory: badgeInventory,
      },
      postedByType: postedByType,
      reactions: [],
      comments: [],
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    if (onPostCreated) {
      onPostCreated(optimisticPost);
    }

    if (!badgeInventory || badgeInventory.length === 0 || 
        (badgeInventory[0] && typeof badgeInventory[0].badgeId === 'string')) {
      getUserBadgeInventory().then((badgeResult) => {
        if (badgeResult.success && badgeResult.data && badgeResult.data.length > 0) {
          const updatedOptimisticPost = {
            ...optimisticPost,
            author: {
              ...optimisticPost.author,
              badgeInventory: badgeResult.data,
            },
            postedById: {
              ...optimisticPost.postedById,
              badgeInventory: badgeResult.data,
            },
          };
          if (onPostCreated) {
            onPostCreated(updatedOptimisticPost, tempPostId);
          }
        }
      }).catch((error) => {});
    }

    const result = await createNewPost(content, images, postedByType, targetId);

    setLoading(false);

    if (result.success) {
      setContent("");
      setImages([]);
      setPrivacy("public");
      onClose();
      
      if (onPostCreated && result.data) {
        onPostCreated(result.data, optimisticPost._id);
      }
    } else {
      if (onPostCreated) {
        onPostCreated(null, optimisticPost._id, true);
      }
      Alert.alert("Failed", result.message);
    }
  };

  const privacyOptions = [
    {
      label: "Public",
      value: "public",
      icon: <Ionicons name="earth" size={18} color={colors.success} />,
    },
    {
      label: "Friends",
      value: "friends",
      icon: <Ionicons name="people" size={18} color={colors.primary} />,
    },
    {
      label: "Only me",
      value: "private",
      icon: <Ionicons name="lock-closed" size={18} color={colors.textTertiary} />,
    },
  ];

  const selectedPrivacy = privacyOptions.find((opt) => opt.value === privacy);

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
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Header */}
          <View 
            className="flex-row items-center justify-between px-6 pt-12 pb-4 rounded-b-3xl shadow-sm z-10"
            style={{ backgroundColor: colors.card }}
          >
            <Text className="text-xl font-bold" style={{ color: colors.primary }}>
              Create Post
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full"
              style={{ backgroundColor: colors.surface }}
            >
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" style={{ backgroundColor: colors.background }}>
            {/* User Info */}
            <View 
              className="flex-row items-center gap-3 px-6 py-4 mt-3 mx-4 rounded-2xl shadow-sm z-20"
              style={{ backgroundColor: colors.card }}
            >
              <Image
                source={{ uri: displayAvatar }}
                className="h-12 w-12 rounded-full"
                style={{ borderWidth: 2, borderColor: colors.primary + '30' }}
                defaultSource={{ uri: "https://i.pravatar.cc/100" }}
              />
              <View className="flex-1">
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  {displayName}
                </Text>
                <Pressable
                  className="flex-row items-center mt-1 px-2 py-1 rounded-lg self-start"
                  style={{ backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '30' }}
                  onPress={() => setShowPrivacy(!showPrivacy)}
                >
                  {selectedPrivacy.icon}
                  <Text className="ml-2 text-xs font-semibold" style={{ color: colors.primary }}>
                    {selectedPrivacy.label}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={colors.primary}
                    style={{ marginLeft: 4 }}
                  />
                </Pressable>
              </View>
            </View>

            {/* Privacy Dropdown */}
            {showPrivacy && (
              <View 
                className="mx-6 mt-1 rounded-xl shadow-lg overflow-hidden z-30"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              >
                {privacyOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    className="flex-row items-center px-4 py-3"
                    style={{ backgroundColor: privacy === opt.value ? colors.primary + '15' : colors.card }}
                    onPress={() => {
                      setPrivacy(opt.value);
                      setShowPrivacy(false);
                    }}
                  >
                    {opt.icon}
                    <Text
                      className="ml-3 text-sm"
                      style={{ 
                        color: privacy === opt.value ? colors.primary : colors.text,
                        fontWeight: privacy === opt.value ? "bold" : "normal"
                      }}
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
                placeholder={isGroupPost ? `Write something to ${displayName}...` : `What's on your mind, ${displayName.split(" ").pop()}?`}
                placeholderTextColor={colors.textTertiary}
                value={content}
                onChangeText={setContent}
                className="text-lg bg-transparent px-2"
                style={{ minHeight: 120, textAlignVertical: "top", color: colors.text }}
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
                      className="h-40 w-32 rounded-xl"
                      style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
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
          <View 
            className="px-6 py-4 safe-bottom"
            style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}
          >
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center rounded-xl py-3"
                style={{ backgroundColor: colors.primary + '15' }}
                onPress={pickImage}
                disabled={loading}
              >
                <Ionicons name="images" size={22} color={loading ? colors.textTertiary : colors.primary} />
                <Text className="ml-2 font-semibold" style={{ color: loading ? colors.textTertiary : colors.primary }}>
                  Image/Video
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-[2] rounded-xl py-3 shadow-sm flex-row justify-center items-center"
                style={{ 
                  backgroundColor: (content.trim() || images.length > 0) ? colors.primary : colors.textTertiary,
                  opacity: loading ? 0.7 : 1
                }}
                onPress={handlePost}
                disabled={loading || (!content.trim() && images.length === 0)}
              >
                {loading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="ml-2 font-bold text-white text-base">
                      Uploading...
                    </Text>
                  </View>
                ) : (
                  <Text className="font-bold text-white text-base">
                    Post
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Loading Overlay */}
          {loading && (
            <View 
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            >
              <View 
                className="rounded-2xl px-6 py-4 items-center"
                style={{ backgroundColor: colors.card }}
              >
                <ActivityIndicator size="large" color={colors.primary} />
                <Text className="mt-3 text-base font-semibold" style={{ color: colors.text }}>
                  Đang tải lên...
                </Text>
                {images.length > 0 && (
                  <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
                    {images.length} ảnh đang được xử lý
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
