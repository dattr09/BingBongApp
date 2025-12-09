import React, { useState } from "react";
import { TouchableOpacity, Image, Text } from "react-native";
import CreatePostModal from "./CreatePostModal";
import { getFullUrl } from "../utils/getPic";
import { useThemeSafe } from "../utils/themeHelper";

export default function CreatePostContainer({ user, onPostCreated }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { colors } = useThemeSafe();
  const avatarUrl =
    getFullUrl(user?.avatar) || "https://i.pravatar.cc/300?img=1";
  return (
    <>
      {!isModalVisible && (
        <TouchableOpacity
          className="flex-row items-center rounded-2xl px-4 py-4 shadow-lg mb-3 w-full self-center"
          style={{ backgroundColor: colors.card }}
          onPress={() => setIsModalVisible(true)}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: avatarUrl }}
            className="w-12 h-12 rounded-full mr-4"
            style={{ borderWidth: 2, borderColor: colors.primary }}
          />
          <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
            What's on your mind?
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
