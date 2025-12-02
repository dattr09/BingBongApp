import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // 1. Import AsyncStorage

// Import MainLayout
import MainLayout from "../../components/MainLayout";

// Các component khác
import CreatePostContainer from "../../components/CreatePostContainer";
import NotificationPopup from "../../components/NotificationPopup";
import PostCard from "../../components/PostCard";

// Service gọi API
import { getAllPosts } from "../../services/postService";

const dummyNotification = {
  title: "đã đăng một bài viết mới",
  author_name: "Alice",
  author_img: "https://i.pravatar.cc/100?img=2",
};

export default function HomeScreen() {
  const navigation = useNavigation();

  // --- STATE ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setCurrentUser(parsedUser);
          console.log("HomeScreen - User loaded:", parsedUser);
        }
      } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
      }
    };
    loadUser();
  }, []);

  // --- API CALL ---
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // --- HANDLERS ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
    onRefresh();
  };

  // --- RENDER HELPERS ---

  // Header của FlatList: Chứa phần tạo bài viết
  const renderHeader = () => (
    <View className="mb-4">
      {/* 3. Truyền currentUser thật vào đây */}
      <CreatePostContainer
        user={currentUser}
        onPostCreated={handlePostCreated}
      />
    </View>
  );

  // Loading View
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
    // QUAN TRỌNG: disableScroll={true} để MainLayout render View thay vì ScrollView
    <MainLayout disableScroll={true}>
      <FlatList
        data={posts}
        keyExtractor={(item) =>
          item._id ? item._id.toString() : Math.random().toString()
        }
        renderItem={({ item }) => <PostCard post={item} />}
        // Header (Create Post) cuộn cùng danh sách
        ListHeaderComponent={renderHeader}
        // Padding dưới cùng để nội dung không bị sát mép khi cuộn hết
        contentContainerStyle={{ paddingBottom: 20 }}
        // Tắt thanh cuộn dọc cho thẩm mỹ
        showsVerticalScrollIndicator={false}
        // Pull to refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0ea5e9"]}
          />
        }
        // Hiển thị khi danh sách trống
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

      {/* Popup thông báo (nằm đè lên trên) */}
      {showPopup && (
        <NotificationPopup
          content={dummyNotification}
          onClose={() => setShowPopup(false)}
        />
      )}
    </MainLayout>
  );
}
