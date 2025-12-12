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
import { useThemeSafe } from "../../utils/themeHelper";
import { getAllGroups, getMyGroups, getJoinedGroups } from "../../services/groupService";
import { getFullUrl } from "../../utils/getPic";

const GroupCard = ({ group, onPress, colors }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ borderRadius: 12, marginBottom: 16, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      activeOpacity={0.8}
    >
      {/* Cover */}
      <View style={{ height: 128, width: "100%", overflow: "hidden", position: "relative" }}>
        <Image
          source={{ uri: getFullUrl(group.coverPhoto) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.2)" }} />
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>
        {/* Avatar + Name */}
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: -40, marginBottom: 12 }}>
          <Image
            source={{ uri: getFullUrl(group.avatar) }}
            style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: "#fff" }}
          />
          <View style={{ flex: 1, marginTop: 24, marginLeft: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }} numberOfLines={1}>
              {group.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <Ionicons name="people-outline" size={14} color={colors.textTertiary} />
              <Text style={{ fontSize: 14, marginLeft: 4, color: colors.textSecondary }}>
                {group.members?.length || 0} members
              </Text>
              <Text style={{ fontSize: 14, marginHorizontal: 4, color: colors.textSecondary }}>•</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {group.visibility === "public" ? "Public" : "Private"} Group
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={{ fontSize: 14, marginBottom: 16, color: colors.textSecondary }} numberOfLines={2}>
          {group.description || "No description available for this group."}
        </Text>

        {/* View Button */}
        <TouchableOpacity 
          onPress={onPress}
          style={{ borderRadius: 8, paddingVertical: 10, backgroundColor: colors.surface }}
          activeOpacity={0.8}
        >
          <Text style={{ fontWeight: "600", textAlign: "center", color: colors.text }}>
            View Group
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function GroupPageScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
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

      // Chỉ set data nếu success và có data
      if (allRes.success) {
        setGroups(Array.isArray(allRes.data) ? allRes.data : []);
      } else {
        console.warn("Failed to fetch all groups:", allRes.message);
        setGroups([]);
      }

      if (mineRes.success) {
        setMyGroups(Array.isArray(mineRes.data) ? mineRes.data : []);
      } else {
        console.warn("Failed to fetch my groups:", mineRes.message);
        setMyGroups([]);
      }

      if (joinedRes.success) {
        setJoinedGroups(Array.isArray(joinedRes.data) ? joinedRes.data : []);
      } else {
        console.warn("Failed to fetch joined groups:", joinedRes.message);
        setJoinedGroups([]);
      }
    } catch (error) {
      console.error("Fetch groups error:", error);
      // Set empty arrays on error
      setGroups([]);
      setMyGroups([]);
      setJoinedGroups([]);
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ borderRadius: 8, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          {/* Tabs */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: activeTab === tab.key ? colors.primary : colors.surface }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: activeTab === tab.key ? "#fff" : colors.text }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search */}
          <View style={{ position: "relative" }}>
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textTertiary}
              style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              placeholder="Search groups..."
              placeholderTextColor={colors.textTertiary}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={{ borderRadius: 8, paddingLeft: 40, paddingRight: 12, paddingVertical: 8, fontSize: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
            />
          </View>
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item, index) => item._id || `group-${index}`}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <GroupCard group={item} onPress={() => handleGroupPress(item)} colors={colors} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 40, padding: 20 }}>
              <Text style={{ textAlign: "center", color: colors.textSecondary }}>
                {loading
                  ? "Loading..."
                  : "No groups found."}
              </Text>
            </View>
          }
        />
      </View>
    </MainLayout>
  );
}

