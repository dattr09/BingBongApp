import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  Ellipsis,
  GraduationCap,
  MapPin,
  Pencil,
  Plus,
  UserCheck,
  UserPlus,
  UserRoundX,
  UserX,
  MessageCircle,
  Camera,
  ChevronRight,
  ShoppingBag,
  Package,
  Award,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
// Components
import CreatePostContainer from "../../components/CreatePostContainer";
import SpinnerLoading from "../../components/SpinnerLoading";
import PostCard from "../../components/PostCard";
import PhotoTab from "../../components/profile/PhotoTab";
import MusicTab from "../../components/profile/MusicTab";
import AboutTab from "../../components/profile/AboutTab";
import FriendTab from "../../components/profile/FriendTab";
import BadgeTab from "../../components/profile/BadgeTab";
import UserBadge from "../../components/UserBadge";
import { useThemeSafe } from "../../utils/themeHelper";
import { API_URL } from "@env";
// Services
import { getUserProfile, uploadAvatar, uploadCoverPhoto } from "../../services/profileService";
import { getUserPosts, deletePost } from "../../services/postService";
import {
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
} from "../../services/friendService";

// Fallback URL nếu chưa có env
export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  const { userId } = route.params || {};

  // Data State
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false); // Spinner cho nút bấm
  const [isOpenFriendsDropdown, setIsOpenFriendsDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  // Relationship State (Local state để update UI nhanh)
  const [isFriend, setIsFriend] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [hasReceivedRequest, setHasReceivedRequest] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // Style helper
  const pressStyle = ({ pressed }) => ({ opacity: pressed ? 0.7 : 1 });

  const getAvatarUrl = (url) => {
    if (!url) return "https://i.pravatar.cc/300?img=1";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  const getCoverUrl = (url) => {
    if (!url) return "https://placehold.co/800x400/e2e8f0/e2e8f0.png";
    if (url.startsWith("http")) return url;
    return `${API_URL}${url}`;
  };

  // --- 1. LOAD DỮ LIỆU ---
  const fetchProfileData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true); // Chỉ hiện loading toàn màn hình lần đầu

      // 1. Lấy Current User (để check quan hệ)
      const storedUser = await AsyncStorage.getItem("user");
      const me = storedUser ? JSON.parse(storedUser) : null;
      setCurrentUser(me);

      // 2. Lấy Profile người đang xem
      const result = await getUserProfile(userId);

      if (result.success) {
        const userProfile = result.data;
        setProfile(userProfile);

        // --- TÍNH TOÁN QUAN HỆ ---
        if (me && userProfile._id !== me._id) {
          // Check Friend: ID của mình có trong list friend của họ không?
          const isFriendCheck = userProfile.friends?.some(
            (f) => f._id === me._id || f === me._id
          );
          setIsFriend(!!isFriendCheck);

          // Check Sent Request: ID của mình có trong list friendRequests của họ không?
          const isSentCheck = userProfile.friendRequests?.some(
            (req) => req._id === me._id || req === me._id
          );
          setHasSentRequest(!!isSentCheck);

          // Check Received Request: ID của họ có trong list friendRequests của MÌNH không?
          // Lưu ý: me.friendRequests có thể cũ do lấy từ AsyncStorage.
          // Đúng ra nên gọi API lấy myProfile mới nhất, nhưng tạm thời check từ local storage hoặc assume false nếu chưa sync.
          const isReceivedCheck = me.friendRequests?.some(
            (req) => req._id === userProfile._id || req === userProfile._id
          );
          setHasReceivedRequest(!!isReceivedCheck);
        }

        // 3. Lấy Posts
        if (userProfile._id) {
          const postsResult = await getUserPosts(userProfile._id);
          if (postsResult.success) setPosts(postsResult.data || []);
          else setPosts([]);
        }
      } else {
        Toast.show({ type: "error", text1: "User not found" });
        navigation.goBack();
      }
    } catch (error) {
      console.error("ProfileScreen Error:", error);
      Toast.show({ type: "error", text1: "Connection error" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  // --- 2. LOGIC HANDLERS (GỌI API) ---

  // Gửi lời mời
  const handleSendRequest = async () => {
    setActionLoading(true);
    const res = await sendFriendRequest(profile._id);
    setActionLoading(false);
    if (res.success) {
      setHasSentRequest(true);
      Toast.show({ type: "success", text1: "Friend request sent" });
    } else {
      Toast.show({ type: "error", text1: res.message });
    }
  };

  // Hủy lời mời đã gửi
  const handleCancelRequest = async () => {
    setActionLoading(true);
    const res = await cancelFriendRequest(profile._id);
    setActionLoading(false);
    if (res.success) {
      setHasSentRequest(false);
      Toast.show({ type: "success", text1: "Đã hủy lời mời" });
    }
  };

  // Chấp nhận lời mời (Khi người ta gửi cho mình)
  const handleAcceptRequest = async () => {
    setActionLoading(true);
    const res = await acceptFriendRequest(profile._id);
    setActionLoading(false);
    if (res.success) {
      setIsFriend(true);
      setHasReceivedRequest(false);
      Toast.show({ type: "success", text1: "Đã chấp nhận kết bạn" });
    }
  };

  // Từ chối lời mời
  const handleDeclineRequest = async () => {
    setActionLoading(true);
    const res = await declineFriendRequest(profile._id);
    setActionLoading(false);
    if (res.success) {
      setHasReceivedRequest(false);
      Toast.show({ type: "success", text1: "Friend request declined" });
    }
  };

  // Hủy kết bạn (Unfriend)
  const handleUnfriend = async () => {
    setIsOpenFriendsDropdown(false);
    setActionLoading(true);
    const res = await removeFriend(profile._id);
    setActionLoading(false);
    if (res.success) {
      setIsFriend(false);
      Toast.show({ type: "success", text1: "Unfriended" });
    }
  };

  const handleAddPost = (newPost) => setPosts((prev) => [newPost, ...prev]);
  const handleRemovePost = async (postId) => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deletePost(postId);
              if (result.success) {
                setPosts((prev) => prev.filter((post) => post._id !== postId));
                Toast.show({ type: "success", text1: "Post deleted" });
              } else {
                Toast.show({ type: "error", text1: result.message || "Unable to delete post" });
              }
            } catch (error) {
              Toast.show({ type: "error", text1: "An error occurred" });
            }
          },
        },
      ]
    );
  };

  // Upload avatar
  const handleUploadAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cần quyền", "Ứng dụng cần quyền truy cập thư viện ảnh");
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
        const uploadResult = await uploadAvatar(
          result.assets[0].uri,
          "User",
          profile._id
        );
        if (uploadResult.success) {
          setProfile((prev) => ({
            ...prev,
            avatar: uploadResult.data?.avatar || uploadResult.data,
          }));
          // Update current user in storage
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            user.avatar = uploadResult.data?.avatar || uploadResult.data;
            await AsyncStorage.setItem("user", JSON.stringify(user));
            setCurrentUser(user);
          }
          Toast.show({ type: "success", text1: "Avatar updated successfully" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Unable to update avatar" });
        }
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Upload cover photo
  const handleUploadCoverPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Cần quyền", "Ứng dụng cần quyền truy cập thư viện ảnh");
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
        const uploadResult = await uploadCoverPhoto(
          result.assets[0].uri,
          "User",
          profile._id
        );
        if (uploadResult.success) {
          setProfile((prev) => ({
            ...prev,
            coverPhoto: uploadResult.data?.coverPhoto || uploadResult.data,
          }));
          // Update current user in storage
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const user = JSON.parse(storedUser);
            user.coverPhoto = uploadResult.data?.coverPhoto || uploadResult.data;
            await AsyncStorage.setItem("user", JSON.stringify(user));
            setCurrentUser(user);
          }
          Toast.show({ type: "success", text1: "Cover photo updated successfully" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Unable to update cover photo" });
        }
      }
    } catch (error) {
      console.error("Upload cover photo error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setUploadingCover(false);
    }
  };

  // --- 3. CHECK IS MY PROFILE ---
  const isMyProfile =
    currentUser && (!userId || (profile && currentUser._id === profile._id));

  // Get equipped badge
  const equippedBadge = React.useMemo(() => {
    if (!profile?.badgeInventory || !Array.isArray(profile.badgeInventory)) return null;

    // Tìm badge đang được đeo
    const equipped = profile.badgeInventory.find(item => item.isEquipped && item.badgeId);
    if (!equipped) return null;

    // badgeId có thể là object đã populate hoặc chỉ là ID string
    const badgeData = equipped.badgeId;

    // Kiểm tra xem badge có đầy đủ thông tin không (name và tier)
    if (badgeData && typeof badgeData === 'object' && badgeData.name && badgeData.tier) {
      return badgeData;
    }

    // Nếu badgeId chỉ là ID string hoặc chưa populate, return null để không hiển thị
    return null;
  }, [profile?.badgeInventory]);

  // --- 4. RENDER BUTTONS ---
  const renderActionButtons = () => {
    // Trường hợp 1: Profile của chính mình
    if (isMyProfile) {
      return (
        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            style={[pressStyle, { backgroundColor: colors.primary }]}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3"
          >
            <Plus color={"white"} size={18} strokeWidth={2.5} />
            <Text className="font-bold text-white">Add to Story</Text>
          </Pressable>
          <Pressable
            style={[pressStyle, { backgroundColor: colors.surface }]}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3"
          >
            <Pencil color={colors.text} size={18} strokeWidth={2.5} />
            <Text className="font-bold" style={{ color: colors.text }}>Edit Profile</Text>
          </Pressable>
        </View>
      );
    }

    // Trường hợp 2: Đã là bạn bè
    if (isFriend) {
      return (
        <View className="flex-row items-center justify-center gap-3 z-10">
          <View className="relative flex-1">
            <Pressable
              style={[pressStyle, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              className="flex-row items-center justify-center gap-2 rounded-full py-3"
              onPress={() => setIsOpenFriendsDropdown(!isOpenFriendsDropdown)}
            >
              <UserCheck color={colors.text} size={18} strokeWidth={2.5} />
              <Text className="font-bold" style={{ color: colors.text }}>Friends</Text>
            </Pressable>
            {/* Dropdown Unfriend */}
            {isOpenFriendsDropdown && (
              <View className="absolute top-14 left-0 right-0 z-50 rounded-xl p-2 shadow-lg" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                <Pressable
                  style={[pressStyle, { backgroundColor: colors.error + '15' }]}
                  className="flex-row items-center gap-3 rounded-lg p-3"
                  onPress={handleUnfriend}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <UserRoundX color={colors.error} size={20} />
                  )}
                  <Text className="font-medium" style={{ color: colors.error }}>Unfriend</Text>
                </Pressable>
              </View>
            )}
          </View>
          <Pressable
            style={[pressStyle, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("Chat", { userChat: profile })}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3"
          >
            <MessageCircle color={"white"} size={18} strokeWidth={2.5} />
            <Text className="font-bold text-white">Message</Text>
          </Pressable>
        </View>
      );
    }

    // Trường hợp 3: Người ta gửi lời mời cho mình (Cần đồng ý/từ chối)
    if (hasReceivedRequest) {
      return (
        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            style={[pressStyle, { backgroundColor: colors.primary }]}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3"
            onPress={handleAcceptRequest}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <UserCheck color={"white"} size={18} strokeWidth={2.5} />
            )}
            <Text className="font-bold text-white">Confirm</Text>
          </Pressable>
          <Pressable
            style={[pressStyle, { backgroundColor: colors.surface }]}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3"
            onPress={handleDeclineRequest}
            disabled={actionLoading}
          >
            <UserX color={colors.text} size={18} strokeWidth={2.5} />
            <Text className="font-bold" style={{ color: colors.text }}>Delete</Text>
          </Pressable>
        </View>
      );
    }

    // Trường hợp 4: Người lạ (Hoặc mình đã gửi lời mời)
    return (
      <View className="flex-row items-center justify-center gap-3">
        <Pressable
          style={[pressStyle, { backgroundColor: hasSentRequest ? colors.surface : colors.primary }]}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3"
          onPress={hasSentRequest ? handleCancelRequest : handleSendRequest}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color={hasSentRequest ? colors.text : "white"} />
          ) : (
            <UserPlus
              color={hasSentRequest ? colors.text : "white"}
              size={18}
              strokeWidth={2.5}
            />
          )}
          <Text
            className="font-bold"
            style={{ color: hasSentRequest ? colors.text : "white" }}
          >
            {hasSentRequest ? "Cancel Request" : "Add Friend"}
          </Text>
        </Pressable>

        <Pressable
          style={[pressStyle, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate("Chat", { userChat: profile })}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full py-3"
        >
          <MessageCircle color={colors.text} size={18} strokeWidth={2.5} />
          <Text className="font-bold" style={{ color: colors.text }}>Message</Text>
        </Pressable>
      </View>
    );
  };

  if (loading) return <SpinnerLoading />;

  // Fallback nếu không có profile
  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
        <Text className="mb-4" style={{ color: colors.textSecondary }}>
          User information not found.
        </Text>
        <Pressable
          onPress={navigation.goBack}
          className="p-3 rounded-lg"
          style={{ backgroundColor: colors.surface }}
        >
          <Text style={{ color: colors.text }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        nestedScrollEnabled={true}
      >
        {/* --- HEADER SECTION --- */}
        <View className="pb-6 rounded-b-3xl shadow-sm mb-4" style={{ backgroundColor: colors.card }}>
          <View className="relative h-60 w-full">
            <Image
              source={{ uri: getCoverUrl(profile.coverPhoto) }}
              className="h-full w-full object-cover"
            />
            {isMyProfile && (
              <TouchableOpacity
                className="absolute bottom-4 right-4 rounded-lg px-4 py-2 flex-row items-center gap-2"
                style={{ backgroundColor: colors.card + 'E6' }}
                onPress={handleUploadCoverPhoto}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Camera size={16} color={colors.primary} />
                )}
                <Text className="text-sm font-medium" style={{ color: colors.text }}>
                  {uploadingCover ? "Loading..." : "Change Cover"}
                </Text>
              </TouchableOpacity>
            )}
            <View className="absolute -bottom-16 left-0 right-0 items-center">
              <View className="relative">
                <Image
                  source={{ uri: getAvatarUrl(profile.avatar) }}
                  className="h-32 w-32 rounded-full shadow-sm"
                  style={{ borderWidth: 4, borderColor: colors.card, backgroundColor: colors.surface }}
                />
                {isMyProfile && (
                  <TouchableOpacity
                    className="absolute bottom-0 right-0 rounded-full p-2"
                    style={{ backgroundColor: colors.primary, borderWidth: 2, borderColor: colors.card }}
                    onPress={handleUploadAvatar}
                    disabled={uploadingAvatar}
                  >
                    {uploadingAvatar ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Camera size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View className="mt-20 px-4 items-center">
            <Text className="text-3xl font-extrabold text-center" style={{ color: colors.text }}>
              {profile.fullName || `${profile.firstName} ${profile.surname}`}
            </Text>
            {/* Display equipped badge */}
            {equippedBadge && (
              <View className="mt-2">
                <UserBadge badge={equippedBadge} mode="large" />
              </View>
            )}
            <Text className="text-center mt-1 px-8 text-sm leading-5" style={{ color: colors.textSecondary }}>
              {profile.bio ||
                "Life is short. Smile while you still have teeth 😁"}
            </Text>

            {/* Stats */}
            <View className="flex-row items-center gap-6 mt-4 mb-6">
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {profile.friends?.length || 0} Friends
              </Text>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>
                {posts.length} Posts
              </Text>
            </View>

            {/* ACTION BUTTONS */}
            <View className="w-full max-w-sm h-14 z-20">
              {renderActionButtons()}
            </View>
          </View>
        </View>

        {/* --- MENU SECTION (Only for my profile) --- */}
        {isMyProfile && (
          <View className="mb-4 shadow-sm" style={{ backgroundColor: colors.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }}>
            <Pressable
              style={[pressStyle, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate("Order")}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.warning + '20' }}>
                  <Package color={colors.warning} size={20} strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  My Orders
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={20} />
            </Pressable>
            <Pressable
              style={[pressStyle, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              onPress={() => navigation.navigate("Cart")}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                  <ShoppingBag color={colors.primary} size={20} strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Cart
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={20} />
            </Pressable>
            <Pressable
              style={pressStyle}
              onPress={() => navigation.navigate("Badge")}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: colors.warning + '20' }}>
                  <Award color={colors.warning} size={20} strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold" style={{ color: colors.text }}>
                  Badges
                </Text>
              </View>
              <ChevronRight color={colors.textTertiary} size={20} />
            </Pressable>
          </View>
        )}

        {/* --- TABS --- */}
        <View className="mb-4 shadow-sm" style={{ backgroundColor: colors.card, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border }}>
          <View className="flex-row" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {[
              { key: "posts", label: "Posts" },
              { key: "about", label: "About" },
              { key: "friends", label: "Friends" },
              { key: "photos", label: "Photos" },
              { key: "music", label: "Music" },
              { key: "badge", label: "Badge" },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className="flex-1 items-center justify-center py-3"
                style={{ borderBottomWidth: activeTab === tab.key ? 2 : 0, borderBottomColor: activeTab === tab.key ? colors.primary : "transparent" }}
              >
                <Text
                  className="font-medium text-center"
                  style={{ color: activeTab === tab.key ? colors.primary : colors.textSecondary }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- TAB CONTENT --- */}
        <View className="flex-1">
          {activeTab === "posts" && (
            <>
              {isMyProfile && currentUser && (
                <View className="shadow-sm mb-4">
                  <CreatePostContainer
                    user={currentUser}
                    onPostCreated={handleAddPost}
                  />
                </View>
              )}
              <View className="gap-4 pb-10">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      currentUser={currentUser}
                      onDeletePost={handleRemovePost}
                    />
                  ))
                ) : (
                  <View className="py-10 items-center rounded-xl" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                    <Text className="text-lg" style={{ color: colors.textTertiary }}>
                      No posts yet
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          {activeTab === "about" && <AboutTab displayedUser={profile} />}
          {activeTab === "friends" && <FriendTab displayedUser={profile} />}
          {activeTab === "photos" && <PhotoTab displayedUser={profile} />}
          {activeTab === "music" && (
            <MusicTab displayedUser={profile} currentUser={currentUser} />
          )}
          {activeTab === "badge" && <BadgeTab displayedUser={profile} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
