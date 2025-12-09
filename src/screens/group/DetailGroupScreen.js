import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getGroupBySlug, joinGroup, leaveGroup } from "../../services/groupService";
import { getUser } from "../../utils/storage";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function DetailGroupScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const { groupSlug } = route.params || {};
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState("discussion");

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupSlug) return;
      setLoading(true);
      try {
        const res = await getGroupBySlug(groupSlug);
        if (res.success) {
          setGroup(res.data);
          setIsJoined(res.data.members?.some(m => m._id === currentUser?._id) || false);
        }
      } catch (error) {
        console.error("Fetch group error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupSlug, currentUser?._id]);

  const handleJoinToggle = async () => {
    if (!currentUser) return;
    
    const previous = isJoined;
    setIsJoined(!previous);

    try {
      const response = previous
        ? await leaveGroup(group._id)
        : await joinGroup(group._id);

      if (!response.success) {
        setIsJoined(previous);
      }
    } catch (error) {
      setIsJoined(previous);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (!group) {
    return (
      <MainLayout>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-center" style={{ color: colors.textSecondary }}>
            Group not found
          </Text>
        </View>
      </MainLayout>
    );
  }

  const isMyGroup = currentUser && group.owner?._id === currentUser._id;

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* Cover Photo */}
        <View className="relative w-full h-64">
          <Image
            source={{ uri: getFullUrl(group.coverPhoto) }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0" style={{ backgroundColor: colors.isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)" }} />
        </View>

        {/* Avatar */}
        <View className="relative -mt-16 mb-4 px-4">
          <View className="flex-row items-end">
            <Image
              source={{ uri: getFullUrl(group.avatar) }}
              className="w-32 h-32 rounded-full border-4"
              style={{ borderColor: colors.card }}
            />
            <View className="ml-4 mb-4 flex-1">
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {group.name}
              </Text>
              <Text className="mt-1" style={{ color: colors.textSecondary }}>
                {group.members?.length || 0} members
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {!isMyGroup && (
          <View className="px-4 mb-4">
            <TouchableOpacity
              onPress={handleJoinToggle}
              className="flex-row items-center justify-center py-3 rounded-md"
              style={{ backgroundColor: isJoined ? colors.surface : colors.primary }}
            >
              <Ionicons
                name={isJoined ? "checkmark" : "add"}
                size={20}
                color={isJoined ? colors.text : "#fff"}
              />
              <Text
                className="ml-2 font-medium"
                style={{ color: isJoined ? colors.text : "#fff" }}
              >
                {isJoined ? "Joined" : "Join Group"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View className="px-4 mb-4 flex-row" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          {["discussion", "about", "members"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="pb-3 px-4 mr-4"
              style={{ borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: activeTab === tab ? colors.primary : "transparent" }}
            >
              <Text
                className="font-medium"
                style={{ color: activeTab === tab ? colors.primary : colors.textSecondary }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className="px-4 pb-8">
          {activeTab === "about" && (
            <View>
              <Text className="leading-6" style={{ color: colors.text }}>
                {group.description || "No description available"}
              </Text>
            </View>
          )}
          {activeTab === "discussion" && (
            <View className="items-center py-10">
              <Text style={{ color: colors.textSecondary }}>Posts coming soon</Text>
            </View>
          )}
          {activeTab === "members" && (
            <View className="items-center py-10">
              <Text style={{ color: colors.textSecondary }}>Members list coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

