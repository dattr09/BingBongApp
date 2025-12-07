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
          <Text className="text-gray-500 text-center">
            Không tìm thấy nhóm
          </Text>
        </View>
      </MainLayout>
    );
  }

  const isMyGroup = currentUser && group.owner?._id === currentUser._id;

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View className="relative w-full h-64">
          <Image
            source={{ uri: getFullUrl(group.coverPhoto) }}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        </View>

        {/* Avatar */}
        <View className="relative -mt-16 mb-4 px-4">
          <View className="flex-row items-end">
            <Image
              source={{ uri: getFullUrl(group.avatar) }}
              className="w-32 h-32 rounded-full border-4 border-white"
            />
            <View className="ml-4 mb-4 flex-1">
              <Text className="text-2xl font-bold text-gray-800">
                {group.name}
              </Text>
              <Text className="text-gray-500 mt-1">
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
              className={`flex-row items-center justify-center py-3 rounded-md ${
                isJoined ? "bg-gray-200" : "bg-blue-600"
              }`}
            >
              <Ionicons
                name={isJoined ? "checkmark" : "add"}
                size={20}
                color={isJoined ? "#000" : "#fff"}
              />
              <Text
                className={`ml-2 font-medium ${
                  isJoined ? "text-black" : "text-white"
                }`}
              >
                {isJoined ? "Joined" : "Join Group"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View className="px-4 mb-4 flex-row border-b border-gray-200">
          {["discussion", "about", "members"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`pb-3 px-4 mr-4 ${
                activeTab === tab
                  ? "border-b-2 border-blue-600"
                  : "border-b-2 border-transparent"
              }`}
            >
              <Text
                className={`font-medium ${
                  activeTab === tab ? "text-blue-600" : "text-gray-500"
                }`}
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
              <Text className="text-gray-700 leading-6">
                {group.description || "No description available"}
              </Text>
            </View>
          )}
          {activeTab === "discussion" && (
            <View className="items-center py-10">
              <Text className="text-gray-500">Posts coming soon</Text>
            </View>
          )}
          {activeTab === "members" && (
            <View className="items-center py-10">
              <Text className="text-gray-500">Members list coming soon</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

