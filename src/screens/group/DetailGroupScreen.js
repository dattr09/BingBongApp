import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getGroupBySlug, joinGroup, leaveGroup } from "../../services/groupService";
import { getGroupPosts, deletePost } from "../../services/postService";
import { uploadAvatar, uploadCoverPhoto } from "../../services/profileService";
import { getUser } from "../../utils/storage";
import { getFullUrl } from "../../utils/getPic";
import CreatePostModal from "../../components/CreatePostModal";
import PostCard from "../../components/PostCard";
import AboutTab from "../../components/group/AboutTab";
import MembersTab from "../../components/group/MembersTab";
import MediaTab from "../../components/group/MediaTab";
import ManageTab from "../../components/group/ManageTab";

export default function DetailGroupScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const { groupSlug } = route.params || {};
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("discussion");
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isPostModalVisible, setIsPostModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  const fetchGroup = useCallback(async () => {
    if (!groupSlug) return;
    setLoading(true);
    try {
      const res = await getGroupBySlug(groupSlug);
      if (res.success) {
        setGroup(res.data);
        const isMember = res.data.members?.some(m => m._id === currentUser?._id || m === currentUser?._id) || false;
        const hasPendingRequest = res.data.pendingMembers?.some(m => m._id === currentUser?._id || m === currentUser?._id) || false;
        setIsJoined(isMember);
        setIsPending(hasPendingRequest);
      }
    } catch (error) {
      console.error("Fetch group error:", error);
    } finally {
      setLoading(false);
    }
  }, [groupSlug, currentUser?._id]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  // Fetch posts when group is loaded and on discussion tab
  useEffect(() => {
    if (group && activeTab === "discussion") {
      fetchPosts();
    }
  }, [group?._id, activeTab]);

  const fetchPosts = async () => {
    if (!group?._id) return;
    setPostsLoading(true);
    try {
      const result = await getGroupPosts(group._id);
      if (result.success) {
        setPosts(result.data || []);
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setPostsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, [group?._id]);

  const handleJoinToggle = async () => {
    if (!currentUser || isProcessing) return;
    
    setIsProcessing(true);

    try {
      if (isPending) {
        const response = await joinGroup(group._id);
        if (response.success) {
          setIsPending(false);
          setGroup(prev => ({
            ...prev,
            pendingMembers: prev.pendingMembers?.filter(m => m._id !== currentUser._id && m !== currentUser._id) || []
          }));
          Toast.show({ type: "success", text1: "Join request canceled" });
        } else {
          Toast.show({ type: "error", text1: response.message || "Failed to cancel request" });
        }
      } else if (isJoined) {
        Alert.alert(
          "Leave Group",
          "Are you sure you want to leave this group?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: async () => {
                const response = await leaveGroup(group._id);
                if (response.success) {
                  setIsJoined(false);
                  setGroup(prev => ({
                    ...prev,
                    members: prev.members?.filter(m => m._id !== currentUser._id && m !== currentUser._id) || [],
                    admins: prev.admins?.filter(a => a._id !== currentUser._id && a !== currentUser._id) || [],
                    moderators: prev.moderators?.filter(m => m._id !== currentUser._id && m !== currentUser._id) || []
                  }));
                  Toast.show({ type: "success", text1: "Left group successfully" });
                } else {
                  Toast.show({ type: "error", text1: response.message || "Failed to leave group" });
                }
              }
            }
          ]
        );
      } else {
        const response = await joinGroup(group._id);
        if (response.success) {
          const action = response.data?.action || response.data;
          if (action === "requested" || action === "pending") {
            setIsPending(true);
            setIsJoined(false);
            setGroup(prev => ({
              ...prev,
              pendingMembers: [
                ...(prev.pendingMembers || []),
                {
                  _id: currentUser._id,
                  avatar: currentUser.avatar,
                  slug: currentUser.slug,
                  fullName: currentUser.fullName,
                }
              ]
            }));
            Toast.show({ type: "success", text1: "Join request sent!" });
          } else if (action === "joined") {
            setIsJoined(true);
            setIsPending(false);
            setGroup(prev => ({
              ...prev,
              members: [
                ...prev.members,
                {
                  _id: currentUser._id,
                  avatar: currentUser.avatar,
                  slug: currentUser.slug,
                  fullName: currentUser.fullName,
                }
              ]
            }));
            Toast.show({ type: "success", text1: "Joined group successfully!" });
          }
        } else {
          Toast.show({ type: "error", text1: response.message || "Failed to join group" });
        }
      }
    } catch (error) {
      console.error("Join/Leave group error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "App needs access to your photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingAvatar(true);
        const uploadResult = await uploadAvatar(result.assets[0].uri, "Group", group._id);
        if (uploadResult.success) {
          setGroup(prev => ({
            ...prev,
            avatar: uploadResult.data?.avatar || uploadResult.data
          }));
          Toast.show({ type: "success", text1: "Avatar updated successfully" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Failed to update avatar" });
        }
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUploadCoverPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "App needs access to your photos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingCover(true);
        const uploadResult = await uploadCoverPhoto(result.assets[0].uri, "Group", group._id);
        if (uploadResult.success) {
          setGroup(prev => ({
            ...prev,
            coverPhoto: uploadResult.data?.coverPhoto || uploadResult.data
          }));
          Toast.show({ type: "success", text1: "Cover photo updated successfully" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Failed to update cover photo" });
        }
      }
    } catch (error) {
      console.error("Upload cover photo error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setUploadingCover(false);
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ textAlign: "center", color: colors.textSecondary }}>
            Group not found
          </Text>
        </View>
      </MainLayout>
    );
  }

  const isGroupAdmin = currentUser && group.admins?.some(admin => admin._id === currentUser._id || admin === currentUser._id);
  const canPost = (isJoined && group.settings?.allowMemberPost) || isGroupAdmin;

  const handlePostCreated = (newPost, tempPostId = null, shouldRemove = false) => {
    if (shouldRemove && tempPostId) {
      setPosts((prev) => prev.filter((post) => post._id !== tempPostId));
      return;
    }

    if (newPost) {
      if (tempPostId) {
        setPosts((prev) => {
          const filtered = prev.filter((post) => post._id !== tempPostId);
          return [newPost, ...filtered];
        });
      } else {
        setPosts((prev) => [newPost, ...prev]);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const result = await deletePost(postId);
      if (result.success) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      }
    } catch (error) {
      console.error("Delete post error:", error);
    }
  };

  const tabs = [
    { key: "discussion", label: "Discussion" },
    { key: "about", label: "About" },
    { key: "members", label: "People" },
    { key: "media", label: "Media" },
    ...(isGroupAdmin ? [{ key: "manage", label: "Manage" }] : []),
  ];

  // Render Header Component
  const renderHeader = () => (
    <View style={{ backgroundColor: colors.background }}>
      {/* Cover Photo */}
      <View style={{ height: 220, width: "100%", position: "relative" }}>
        <Image
          source={{ uri: getFullUrl(group.coverPhoto) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.isDark ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)" }} />
        
        {isGroupAdmin && (
          <TouchableOpacity
            onPress={handleUploadCoverPhoto}
            disabled={uploadingCover}
            style={{ 
              position: "absolute", 
              bottom: 16, 
              right: 16, 
              flexDirection: "row", 
              alignItems: "center", 
              gap: 8, 
              backgroundColor: "rgba(255, 255, 255, 0.95)", 
              paddingHorizontal: 16, 
              paddingVertical: 10, 
              borderRadius: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            activeOpacity={0.8}
          >
            {uploadingCover ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="camera-outline" size={18} color="#000" />
            )}
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#000" }}>
              {uploadingCover ? "Uploading..." : "Change cover"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar and Info - Nằm trong card trắng */}
      <View style={{ 
        marginTop: 16, 
        marginBottom: 20, 
        marginHorizontal: 16,
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: getFullUrl(group.avatar) }}
              style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: colors.border }}
            />
            {isGroupAdmin && (
              <TouchableOpacity
                onPress={handleUploadAvatar}
                disabled={uploadingAvatar}
                style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  right: 0, 
                  padding: 8, 
                  borderRadius: 18, 
                  backgroundColor: colors.card,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
                activeOpacity={0.8}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="camera-outline" size={16} color={colors.text} />
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              {group.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
              {group.visibility === "public" ? (
                <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
              ) : (
                <Ionicons name="lock-closed-outline" size={16} color={colors.textSecondary} />
              )}
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                {group.visibility === "public" ? "Public" : "Private"} Group
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginHorizontal: 6 }}>•</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                {group.members?.length || 0} members
              </Text>
            </View>
            {/* Member Avatars */}
            {group.members && group.members.length > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                {group.members.slice(0, 10).map((member, index) => (
                  <TouchableOpacity
                    key={member._id || index}
                    onPress={() => navigation.navigate("Profile", { userSlug: member.slug })}
                    style={{ marginLeft: index > 0 ? -10 : 0 }}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: getFullUrl(member.avatar) }}
                      style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.card }}
                    />
                  </TouchableOpacity>
                ))}
                {group.members.length > 10 && (
                  <Text style={{ fontSize: 12, marginLeft: 8, color: colors.textSecondary, fontWeight: "500" }}>
                    +{group.members.length - 10} more
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ paddingHorizontal: 16, marginBottom: 20, flexDirection: "row", gap: 10 }}>
        {isJoined ? (
          <TouchableOpacity
            onPress={handleJoinToggle}
            disabled={isProcessing}
            style={{ 
              flex: 1, 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "center", 
              paddingVertical: 14, 
              borderRadius: 10, 
              backgroundColor: colors.surface,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="checkmark-circle" size={22} color={colors.text} />
            )}
            <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 15, color: colors.text }}>
              {isProcessing ? "Processing..." : "Joined"}
            </Text>
          </TouchableOpacity>
        ) : isPending ? (
          <TouchableOpacity
            onPress={handleJoinToggle}
            disabled={isProcessing}
            style={{ 
              flex: 1, 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "center", 
              paddingVertical: 14, 
              borderRadius: 10, 
              backgroundColor: "#fbbf24",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="time-outline" size={22} color="#fff" />
            )}
            <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 15, color: "#fff" }}>
              {isProcessing ? "Processing..." : "Pending"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleJoinToggle}
            disabled={isProcessing}
            style={{ 
              flex: 1, 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "center", 
              paddingVertical: 14, 
              borderRadius: 10, 
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add-circle" size={22} color="#fff" />
            )}
            <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 15, color: "#fff" }}>
              {isProcessing ? "Processing..." : "Join Group"}
            </Text>
          </TouchableOpacity>
        )}
        {isJoined && (
          <TouchableOpacity
            onPress={() => navigation.navigate("Chat", {
              group: group,
              chatType: "fanpage",
            })}
            style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              justifyContent: "center", 
              paddingVertical: 14, 
              paddingHorizontal: 18, 
              borderRadius: 10, 
              backgroundColor: colors.surface,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
            <Text style={{ marginLeft: 8, fontWeight: "600", fontSize: 15, color: colors.text }}>
              Message
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{ 
                paddingBottom: 14, 
                paddingHorizontal: 18, 
                marginRight: 8, 
                borderBottomWidth: activeTab === tab.key ? 3 : 0, 
                borderBottomColor: activeTab === tab.key ? colors.primary : "transparent" 
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{ 
                  fontWeight: activeTab === tab.key ? "600" : "500", 
                  fontSize: 15,
                  color: activeTab === tab.key ? colors.primary : colors.textSecondary 
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <MainLayout disableScroll={true}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {activeTab === "discussion" ? (
          <>
            {postsLoading && posts.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <SpinnerLoading />
              </View>
            ) : (
              <FlatList
                data={posts}
                keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: 16 }}>
                    <PostCard
                      post={item}
                      currentUser={currentUser}
                      onDeletePost={handleDeletePost}
                    />
                  </View>
                )}
                scrollEnabled={true}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
                ListHeaderComponent={
                  <>
                    {renderHeader()}
                    {canPost && (
                      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                        <TouchableOpacity
                          onPress={() => setIsPostModalVisible(true)}
                          style={{ 
                            flexDirection: "row", 
                            alignItems: "center", 
                            borderRadius: 12, 
                            padding: 16, 
                            backgroundColor: colors.card, 
                            borderWidth: 1, 
                            borderColor: colors.border,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                          activeOpacity={0.8}
                        >
                          <Image
                            source={{ uri: getFullUrl(currentUser?.avatar) }}
                            style={{ width: 48, height: 48, borderRadius: 24, marginRight: 16, borderWidth: 2, borderColor: colors.primary }}
                          />
                          <Text style={{ fontSize: 16, fontWeight: "500", flex: 1, color: colors.textSecondary }}>
                            Write something to {group.name}...
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                }
                ListEmptyComponent={
                  <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 16 }}>
                    <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                    <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>
                      No posts available
                    </Text>
                    <Text style={{ marginTop: 4, fontSize: 14, color: colors.textTertiary }}>
                      Be the first to post in this group!
                    </Text>
                  </View>
                }
                style={{ paddingHorizontal: 0 }}
              />
            )}
          </>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: colors.background }}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {renderHeader()}
            <View style={{ paddingTop: 8 }}>
              {activeTab === "about" && (
                <AboutTab group={group} currentUser={currentUser} />
              )}
              {activeTab === "members" && (
                <MembersTab group={group} />
              )}
              {activeTab === "media" && (
                <MediaTab group={group} />
              )}
              {activeTab === "manage" && isGroupAdmin && (
                <ManageTab
                  group={group}
                  onGroupUpdate={(updatedGroup) => {
                    if (updatedGroup) {
                      setGroup(updatedGroup);
                    }
                  }}
                />
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={isPostModalVisible}
        onClose={() => setIsPostModalVisible(false)}
        onPostCreated={handlePostCreated}
        user={currentUser}
        postedByType="Group"
        postedById={group?._id}
        postedBy={{
          _id: group?._id,
          name: group?.name,
          avatar: group?.avatar,
          slug: group?.slug,
        }}
      />
    </MainLayout>
  );
}
