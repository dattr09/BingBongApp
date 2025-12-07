import React, { useState } from "react";
import { TouchableOpacity, Image, Text } from "react-native";
import CreatePostModal from "./CreatePostModal";
import { getFullUrl } from "../utils/getPic";
export default function CreatePostContainer({ user, onPostCreated }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const avatarUrl =
    getFullUrl(user?.avatar) || "https://i.pravatar.cc/300?img=1";
  return (
    <>
      {!isModalVisible && (
        <TouchableOpacity
          className="flex-row items-center bg-white rounded-2xl px-4 py-4 shadow-lg mb-3 mx-2 w-[97%] self-center"
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: avatarUrl }}
            className="w-12 h-12 rounded-full mr-4 border-2 border-blue-200"
          />
          <Text className="text-gray-600 text-base font-medium">
            Bạn đang nghĩ gì?
          </Text>
        </TouchableOpacity>
      )}

      <CreatePostModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        user={user}
        onPostCreated={onPostCreated}
      />
    </>
  );
}
