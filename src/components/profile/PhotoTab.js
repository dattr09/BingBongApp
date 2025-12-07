import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getUserPosts } from "../../services/postService";
import SpinnerLoading from "../SpinnerLoading";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function PhotoTab({ displayedUser }) {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (displayedUser?._id) {
      fetchPosts();
    }
  }, [displayedUser?._id]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const result = await getUserPosts(displayedUser._id);
      if (result.success) {
        setPosts(result.data || []);
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extract all images from posts
  const allImages = useMemo(() => {
    if (!posts) return [];
    
    return posts.reduce((acc, post) => {
      if (post.media && post.media.length > 0) {
        const postImages = post.media.map((img) => ({
          url: img,
          postId: post._id,
          caption: post.content || "",
        }));
        return [...acc, ...postImages];
      }
      return acc;
    }, []);
  }, [posts]);

  const handleImagePress = (image) => {
    navigation.navigate("DetailPost", { postId: image.postId });
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <SpinnerLoading />
      </View>
    );
  }

  if (allImages.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
          <Ionicons name="images-outline" size={48} color="#9ca3af" />
        </View>
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          Chưa có ảnh nào
        </Text>
        <Text className="text-gray-500 text-center">
          Người dùng này chưa đăng ảnh nào
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-900">
          Ảnh ({allImages.length})
        </Text>
      </View>
      <FlatList
        data={allImages}
        numColumns={3}
        keyExtractor={(item, index) => `${item.postId}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="flex-1 aspect-square m-0.5"
            onPress={() => handleImagePress(item)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: getFullUrl(item.url) }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 2 }}
      />
    </View>
  );
}

