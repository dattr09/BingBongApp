import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import MainLayout from "../../components/MainLayout";
import CreatePostContainer from "../../components/CreatePostContainer";
import NotificationPopup from "../../components/NotificationPopup";
import PostCard from "../../components/PostCard";

import { getAllPosts } from "../../services/postService";
import { getUser } from "../../utils/storage"; // lấy currentUser từ storage

const dummyNotification = {
  title: "đã đăng một bài viết mới",
  author_name: "Alice",
  author_img: "https://i.pravatar.cc/100?img=2",
};

export default function HomeScreen() {
  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // --- Fetch current user từ storage
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // --- Fetch posts ---
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

  const handlePostCreated = () => {
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
    onRefresh();
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
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="text-gray-500 mt-2">Đang tải bảng tin...</Text>
        </View>
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
        renderItem={({ item }) => <PostCard post={item} currentUser={currentUser} />}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0ea5e9"]} />
        }
        ListEmptyComponent={
          <View className="items-center mt-10 p-5">
            <Text className="text-gray-500 text-center">
              {loading
                ? "Đang tải..."
                : "Chưa có bài viết nào.\nHãy là người đầu tiên chia sẻ khoảnh khắc!"}
            </Text>
          </View>
        }
      />

      {showPopup && (
        <NotificationPopup
          content={dummyNotification}
          onClose={() => setShowPopup(false)}
        />
      )}
    </MainLayout>
  );
}
