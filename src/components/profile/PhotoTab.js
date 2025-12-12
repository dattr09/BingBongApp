import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { getUserPosts } from "../../services/postService";
import SpinnerLoading from "../SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";

export default function PhotoTab({ displayedUser }) {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
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
    } finally {
      setLoading(false);
    }
  };
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
      <View className="flex-1 items-center justify-center py-20 px-4" style={{ backgroundColor: colors.background }}>
        <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: colors.surface }}>
          <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
        </View>
        <Text className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
          No photos yet
        </Text>
        <Text className="text-center" style={{ color: colors.textSecondary }}>
          This user has not posted any photos yet
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text className="text-xl font-semibold" style={{ color: colors.text }}>
          Photos ({allImages.length})
        </Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 4,
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {allImages.map((item, index) => (
          <TouchableOpacity
            key={`${item.postId}-${index}`}
            className="m-0.5"
            style={{ width: "33.3333%" }}
            onPress={() => handleImagePress(item)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: getFullUrl(item.url) }}
              className="w-full aspect-square"
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

