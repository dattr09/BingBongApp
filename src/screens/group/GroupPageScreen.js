import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { getAllGroups, getMyGroups, getJoinedGroups } from "../../services/groupService";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const GroupCard = ({ group, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-md mb-4 overflow-hidden border border-gray-200"
    >
      {/* Cover */}
      <View className="h-32 w-full overflow-hidden relative">
        <Image
          source={{ uri: getFullUrl(group.coverPhoto) }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Avatar + Name */}
        <View className="flex-row items-center -mt-10 mb-3">
          <Image
            source={{ uri: getFullUrl(group.avatar) }}
            className="w-16 h-16 rounded-full border-4 border-white"
          />
          <View className="flex-1 mt-6 ml-3">
            <Text className="text-lg font-semibold text-gray-800" numberOfLines={1}>
              {group.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="people-outline" size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500 ml-1">
                {group.members?.length || 0} members
              </Text>
              <Text className="text-sm text-gray-500 mx-1">•</Text>
              <Text className="text-sm text-gray-500">
                {group.visibility === "public" ? "Public" : "Private"} Group
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text className="text-sm text-gray-600 mb-4" numberOfLines={2}>
          {group.description || "No description available for this group."}
        </Text>

        {/* View Button */}
        <TouchableOpacity className="bg-gray-100 rounded-lg py-2.5">
          <Text className="text-gray-700 font-semibold text-center">
            View Group
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function GroupPageScreen() {
  const navigation = useNavigation();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const [allRes, mineRes, joinedRes] = await Promise.all([
        getAllGroups(),
        getMyGroups(),
        getJoinedGroups(),
      ]);

      if (allRes.success) setGroups(allRes.data || []);
      if (mineRes.success) setMyGroups(mineRes.data || []);
      if (joinedRes.success) setJoinedGroups(joinedRes.data || []);
    } catch (error) {
      console.error("Fetch groups error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let source = groups;
    if (activeTab === "my") source = myGroups;
    else if (activeTab === "joined") source = joinedGroups;

    if (!searchTerm.trim()) {
      setFiltered(source);
    } else {
      const lower = searchTerm.toLowerCase();
      setFiltered(
        source.filter(
          (group) =>
            group.name?.toLowerCase().includes(lower) ||
            group.description?.toLowerCase().includes(lower)
        )
      );
    }
  }, [activeTab, groups, myGroups, joinedGroups, searchTerm]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleGroupPress = (group) => {
    navigation.navigate("DetailGroup", { groupSlug: group.slug });
  };

  const tabs = [
    { key: "all", label: "All Groups" },
    { key: "my", label: "My Groups" },
    { key: "joined", label: "Joined" },
  ];

  if (loading && !refreshing && filtered.length === 0) {
    return (
      <MainLayout disableScroll={true}>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout disableScroll={true}>
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          {/* Tabs */}
          <View className="flex-row gap-2 mb-3">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md ${
                  activeTab === tab.key
                    ? "bg-blue-600"
                    : "bg-gray-100"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    activeTab === tab.key ? "text-white" : "text-gray-700"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View className="relative">
            <Ionicons
              name="search-outline"
              size={20}
              color="#9ca3af"
              style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              placeholder="Search groups..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="bg-gray-50 border border-gray-300 rounded-md pl-10 pr-3 py-2 text-sm"
            />
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <GroupCard group={item} onPress={() => handleGroupPress(item)} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10 p-5">
              <Text className="text-gray-500 text-center">
                {loading
                  ? "Đang tải..."
                  : "Không tìm thấy nhóm nào."}
              </Text>
            </View>
          }
        />
      </View>
    </MainLayout>
  );
}

