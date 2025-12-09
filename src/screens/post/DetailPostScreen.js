import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import MainLayout from "../../components/MainLayout";
import PostCard from "../../components/PostCard";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getPostById } from "../../services/postService";
import { getUser } from "../../utils/storage";

export default function DetailPostScreen() {
  const route = useRoute();
  const { colors } = useThemeSafe();
  const { postId } = route.params || {};
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const res = await getPostById(postId);
        if (res.success && res.data) {
          setPost(res.data);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Fetch post error:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (notFound || !post) {
    return (
      <MainLayout>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-center text-lg" style={{ color: colors.textSecondary }}>
            Post not found
          </Text>
          <Text className="text-center mt-2" style={{ color: colors.textTertiary }}>
            The post may have been deleted or does not exist
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="py-4">
          <PostCard post={post} currentUser={currentUser} />
        </View>
      </ScrollView>
    </MainLayout>
  );
}

