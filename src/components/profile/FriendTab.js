import React, { useState, useMemo } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";

const FriendCard = ({ friend, onPress, colors }) => (
  <TouchableOpacity
    className="rounded-lg p-4 mb-4"
    style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View className="items-center">
      <Image
        source={{ uri: getFullUrl(friend.avatar) || "https://i.pravatar.cc/300?img=1" }}
        className="w-24 h-24 rounded-full mb-3"
        style={{ borderWidth: 4, borderColor: colors.surface }}
      />
      <Text className="text-base font-semibold text-center mb-1" style={{ color: colors.text }}>
        {friend.fullName}
      </Text>
      <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>@{friend.slug}</Text>
      {friend.bio && (
        <Text className="text-xs text-center mt-2" style={{ color: colors.textSecondary }} numberOfLines={2}>
          {friend.bio}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

export default function FriendTab({ displayedUser }) {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
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
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center gap-3 mb-4">
          <View className="p-2 rounded-lg" style={{ backgroundColor: colors.primary + '20' }}>
            <Ionicons name="people" size={24} color={colors.primary} />
          </View>
          <View>
            <Text className="text-xl font-semibold" style={{ color: colors.text }}>Friends</Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {friends.length} friends
            </Text>
          </View>
        </View>

        {friends.length > 0 && (
          <View className="relative">
            <Ionicons
              name="search"
              size={20}
              color={colors.textTertiary}
              style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              className="w-full pl-10 pr-4 py-2.5 rounded-lg"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
              placeholder="Find friends..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      {friends.length === 0 ? (
        <View className="items-center py-20">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: colors.surface }}>
            <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
          </View>
          <Text className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            No friends yet
          </Text>
          <Text className="text-center" style={{ color: colors.textSecondary }}>
            This user has not added any friends yet
          </Text>
        </View>
      ) : filteredFriends.length === 0 ? (
        <View className="items-center py-20">
          <Text style={{ color: colors.textSecondary }}>No friends found</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 8, flexDirection: "row", flexWrap: "wrap" }}
          style={{ backgroundColor: colors.background }}
        >
          {filteredFriends.map((item) => (
            <View key={item._id} style={{ width: "50%", padding: 8 }}>
              <FriendCard friend={item} onPress={() => handleFriendPress(item)} colors={colors} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

