import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../../components/MainLayout";
import CreatePostContainer from "../../components/CreatePostContainer";
import PostCard from "../../components/PostCard";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getAllPosts, deletePost } from "../../services/postService";
import { getUser } from "../../utils/storage";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const fetchPosts = async () => {
    if (!refreshing) setLoading(true);
    try {
      const result = await getAllPosts();
      if (result && result.success) {
        setPosts(result.data || []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Exception in fetchPosts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost, tempPostId = null, shouldRemove = false) => {
    if (shouldRemove && tempPostId) {
      setPosts((prev) => prev.filter((post) => post._id !== tempPostId));
      return;
    }

    if (newPost) {
      if (tempPostId) {
        setPosts((prev) => {
          const filtered = prev.filter((post) => post._id !== tempPostId);
          return [newPost, ...filtered];
        });
      } else {
        setPosts((prev) => [newPost, ...prev]);
      }
    } else {
      onRefresh();
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const result = await deletePost(postId);
      if (result.success) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      }
    } catch (error) {
      console.error("Delete post error:", error);
    }
  };

  const renderHeader = () => (
    <View className="mb-4">
      {currentUser && (
        <CreatePostContainer
          user={currentUser}
          onPostCreated={handlePostCreated}
        />
      )}
    </View>
  );

  if (loading && !refreshing && posts.length === 0) {
    return (
      <MainLayout disableScroll={true}>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout disableScroll={true}>
      <FlatList
        data={posts}
        keyExtractor={(item) =>
          item._id ? item._id.toString() : Math.random().toString()
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUser={currentUser}
            onDeletePost={handleDeletePost}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 0 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0ea5e9"]} />
        }
        ListEmptyComponent={
          <View className="items-center mt-10 p-5">
            <Text className="text-center" style={{ color: colors.textSecondary }}>
              {loading
                ? "Loading..."
                : "No posts yet.\nBe the first to share a moment!"}
            </Text>
          </View>
        }
      />
    </MainLayout>
  );
}
