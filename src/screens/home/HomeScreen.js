import React, { useState } from "react";
import { Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MainLayout from "../../components/MainLayout";
import CreatePostContainer from "../../components/CreatePostContainer";
import NotificationPopup from "../../components/NotificationPopup";
import PostCard from "../../components/PostCard"; // hoặc PostCardDemo nếu bạn export default là PostCardDemo

const dummyNotification = {
  title: "đã đăng một bài viết mới",
  author_name: "Alice",
  author_img: "https://i.pravatar.cc/100?img=2",
};

export default function HomeScreen() {
  const [showPopup, setShowPopup] = useState(false);
  const navigation = useNavigation();

  const user = {
    name: "BingBong User",
    avatar: "https://i.pravatar.cc/100",
  };

  const handlePost = () => {
    // Mỗi lần post, hiển thị popup
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  return (
    <MainLayout>
      <CreatePostContainer user={user} onPostCreated={handlePost} />

      {/* Hiển thị PostCard */}
      <PostCard />

      {/* Notification Popup Demo */}
      {showPopup && (
        <NotificationPopup
          content={dummyNotification}
          onClose={() => setShowPopup(false)}
        />
      )}
    </MainLayout>
  );
}
