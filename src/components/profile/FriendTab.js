import React, { useState, useMemo } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const FriendCard = ({ friend, onPress }) => (
  <TouchableOpacity
    className="bg-white rounded-lg border border-gray-200 p-4 mb-4"
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View className="items-center">
      <Image
        source={{ uri: getFullUrl(friend.avatar) }}
        className="w-24 h-24 rounded-full mb-3 border-4 border-gray-100"
      />
      <Text className="text-base font-semibold text-gray-900 text-center mb-1">
        {friend.fullName}
      </Text>
      <Text className="text-sm text-gray-500 text-center">@{friend.slug}</Text>
      {friend.bio && (
        <Text className="text-xs text-gray-600 text-center mt-2" numberOfLines={2}>
          {friend.bio}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

export default function FriendTab({ displayedUser }) {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  const friends = useMemo(() => displayedUser?.friends || [], [displayedUser?.friends]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.fullName?.toLowerCase().includes(query) ||
        friend.slug?.toLowerCase().includes(query)
    );
  }, [friends, searchQuery]);

  const handleFriendPress = (friend) => {
    navigation.navigate("Profile", { userId: friend._id });
  };

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="p-2 bg-blue-100 rounded-lg">
            <Ionicons name="people" size={24} color="#3b82f6" />
          </View>
          <View>
            <Text className="text-xl font-semibold text-gray-900">Bạn bè</Text>
            <Text className="text-sm text-gray-500">
              {friends.length} bạn bè
            </Text>
          </View>
        </View>

        {friends.length > 0 && (
          <View className="relative">
            <Ionicons
              name="search"
              size={20}
              color="#9ca3af"
              style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
              placeholder="Tìm bạn bè..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      {friends.length === 0 ? (
        <View className="items-center py-20">
          <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="people-outline" size={48} color="#9ca3af" />
          </View>
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            Chưa có bạn bè
          </Text>
          <Text className="text-gray-500 text-center">
            Người dùng này chưa có bạn bè nào
          </Text>
        </View>
      ) : filteredFriends.length === 0 ? (
        <View className="items-center py-20">
          <Text className="text-gray-500">Không tìm thấy bạn bè</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View className="flex-1 p-2">
              <FriendCard friend={item} onPress={() => handleFriendPress(item)} />
            </View>
          )}
          contentContainerStyle={{ padding: 8 }}
        />
      )}
    </View>
  );
}

