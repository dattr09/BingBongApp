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
        Toast.show({ type: "error", text1: "Không tìm thấy người dùng" });
        navigation.goBack();
      }
    } catch (error) {
      console.error("ProfileScreen Error:", error);
      Toast.show({ type: "error", text1: "Lỗi kết nối" });
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
      Toast.show({ type: "success", text1: "Đã gửi lời mời kết bạn" });
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
      Toast.show({ type: "success", text1: "Đã từ chối lời mời" });
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
      Toast.show({ type: "success", text1: "Đã hủy kết bạn" });
    }
  };

  const handleAddPost = (newPost) => setPosts((prev) => [newPost, ...prev]);
  const handleRemovePost = async (postId) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa bài viết này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deletePost(postId);
              if (result.success) {
                setPosts((prev) => prev.filter((post) => post._id !== postId));
                Toast.show({ type: "success", text1: "Đã xóa bài viết" });
              } else {
                Toast.show({ type: "error", text1: result.message || "Không thể xóa bài viết" });
              }
            } catch (error) {
              Toast.show({ type: "error", text1: "Đã xảy ra lỗi" });
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
          Toast.show({ type: "success", text1: "Cập nhật ảnh đại diện thành công" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Không thể cập nhật ảnh" });
        }
      }
    } catch (error) {
      console.error("Upload avatar error:", error);
      Toast.show({ type: "error", text1: "Đã xảy ra lỗi" });
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
          Toast.show({ type: "success", text1: "Cập nhật ảnh bìa thành công" });
        } else {
          Toast.show({ type: "error", text1: uploadResult.message || "Không thể cập nhật ảnh" });
        }
      }
    } catch (error) {
      console.error("Upload cover photo error:", error);
      Toast.show({ type: "error", text1: "Đã xảy ra lỗi" });
    } finally {
      setUploadingCover(false);
    }
  };

  // --- 3. CHECK IS MY PROFILE ---
  const isMyProfile =
    currentUser && (!userId || (profile && currentUser._id === profile._id));

  // --- 4. RENDER BUTTONS ---
  const renderActionButtons = () => {
    // Trường hợp 1: Profile của chính mình
    if (isMyProfile) {
      return (
        <View className="flex-row items-center justify-center gap-3">
          <Pressable
            style={pressStyle}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3"
          >
            <Plus color={"white"} size={18} strokeWidth={2.5} />
            <Text className="font-bold text-white">Add to Story</Text>
          </Pressable>
          <Pressable
            style={pressStyle}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3"
          >
            <Pencil color={"#374151"} size={18} strokeWidth={2.5} />
            <Text className="font-bold text-gray-700">Edit Profile</Text>
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
              style={pressStyle}
              className="flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3 border border-gray-200"
              onPress={() => setIsOpenFriendsDropdown(!isOpenFriendsDropdown)}
            >
              <UserCheck color={"#111827"} size={18} strokeWidth={2.5} />
              <Text className="font-bold text-gray-900">Friends</Text>
            </Pressable>
            {/* Dropdown Unfriend */}
            {isOpenFriendsDropdown && (
              <View className="absolute top-14 left-0 right-0 z-50 rounded-xl bg-white p-2 shadow-lg shadow-gray-300 border border-gray-100">
                <Pressable
                  style={pressStyle}
                  className="flex-row items-center gap-3 rounded-lg p-3 bg-red-50"
                  onPress={handleUnfriend}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <UserRoundX color={"#ef4444"} size={20} />
                  )}
                  <Text className="font-medium text-red-500">Unfriend</Text>
                </Pressable>
              </View>
            )}
          </View>
          <Pressable
            style={pressStyle}
            onPress={() => navigation.navigate("Chat", { userChat: profile })}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3"
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
            style={pressStyle}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3"
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
            style={pressStyle}
            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-200 py-3"
            onPress={handleDeclineRequest}
            disabled={actionLoading}
          >
            <UserX color={"black"} size={18} strokeWidth={2.5} />
            <Text className="font-bold text-gray-700">Delete</Text>
          </Pressable>
        </View>
      );
    }

    // Trường hợp 4: Người lạ (Hoặc mình đã gửi lời mời)
    return (
      <View className="flex-row items-center justify-center gap-3">
        <Pressable
          style={pressStyle}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-full py-3 ${hasSentRequest ? "bg-gray-200" : "bg-blue-600"}`}
          onPress={hasSentRequest ? handleCancelRequest : handleSendRequest}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color={hasSentRequest ? "black" : "white"} />
          ) : (
            <UserPlus
              color={hasSentRequest ? "#374151" : "white"}
              size={18}
              strokeWidth={2.5}
            />
          )}
          <Text
            className={`font-bold ${hasSentRequest ? "text-gray-700" : "text-white"}`}
          >
            {hasSentRequest ? "Cancel Request" : "Add Friend"}
          </Text>
        </Pressable>

        <Pressable
          style={pressStyle}
          onPress={() => navigation.navigate("Chat", { userChat: profile })}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3"
        >
          <MessageCircle color={"#374151"} size={18} strokeWidth={2.5} />
          <Text className="font-bold text-gray-700">Message</Text>
        </Pressable>
      </View>
    );
  };

  if (loading) return <SpinnerLoading />;

  // Fallback nếu không có profile
  if (!profile) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500 mb-4">
          Không tìm thấy thông tin người dùng.
        </Text>
        <Pressable
          onPress={navigation.goBack}
          className="p-3 bg-gray-100 rounded-lg"
        >
          <Text>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
          />
        }
        nestedScrollEnabled={true}
      >
        {/* --- HEADER SECTION --- */}
        <View className="bg-white pb-6 rounded-b-3xl shadow-sm mb-4">
          <View className="relative h-60 w-full">
            <Image
              source={{ uri: getCoverUrl(profile.coverPhoto) }}
              className="h-full w-full object-cover"
            />
            {isMyProfile && (
              <TouchableOpacity
                className="absolute bottom-4 right-4 bg-white/90 rounded-lg px-4 py-2 flex-row items-center gap-2"
                onPress={handleUploadCoverPhoto}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Camera size={16} color="#3B82F6" />
                )}
                <Text className="text-sm font-medium text-gray-900">
                  {uploadingCover ? "Đang tải..." : "Đổi ảnh bìa"}
                </Text>
              </TouchableOpacity>
            )}
            <View className="absolute -bottom-16 left-0 right-0 items-center">
              <View className="relative">
                <Image
                  source={{ uri: getAvatarUrl(profile.avatar) }}
                  className="h-32 w-32 rounded-full border-[4px] border-white shadow-sm bg-gray-200"
                />
                {isMyProfile && (
                  <TouchableOpacity
                    className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 border-2 border-white"
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
            <Text className="text-3xl font-extrabold text-gray-900 text-center">
              {profile.fullName || `${profile.firstName} ${profile.surname}`}
            </Text>
            <Text className="text-gray-500 text-center mt-1 px-8 text-sm leading-5">
              {profile.bio ||
                "Life is short. Smile while you still have teeth 😁"}
            </Text>

            {/* Stats */}
            <View className="flex-row items-center gap-6 mt-4 mb-6">
              <Text className="text-lg font-bold text-gray-900">
                {profile.friends?.length || 0} Friends
              </Text>
              <Text className="text-lg font-bold text-gray-900">
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
          <View className="bg-white rounded-xl mx-4 mb-4 shadow-sm border border-gray-100">
            <Pressable
              style={pressStyle}
              onPress={() => navigation.navigate("Order")}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center">
                  <Package color={"#FF6B35"} size={20} strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold text-gray-900">
                  Đơn hàng của tôi
                </Text>
              </View>
              <ChevronRight color={"#9ca3af"} size={20} />
            </Pressable>
            <Pressable
              style={pressStyle}
              onPress={() => navigation.navigate("Cart")}
              className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                  <ShoppingBag color={"#3b82f6"} size={20} strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold text-gray-900">
                  Giỏ hàng
                </Text>
              </View>
              <ChevronRight color={"#9ca3af"} size={20} />
            </Pressable>
            <Pressable
              style={pressStyle}
              onPress={() => navigation.navigate("Badge")}
              className="flex-row items-center justify-between px-4 py-4"
            >
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center">
                  <Award color={"#FFD700"} size={20} strokeWidth={2} />
                </View>
                <Text className="text-base font-semibold text-gray-900">
                  Danh hiệu
                </Text>
              </View>
              <ChevronRight color={"#9ca3af"} size={20} />
            </Pressable>
          </View>
        )}

        {/* --- TABS --- */}
        <View className="bg-white mx-4 mb-4 rounded-xl shadow-sm border border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-gray-200">
            <View className="flex-row">
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
                  className={`px-4 py-3 border-b-2 ${
                    activeTab === tab.key
                      ? "border-blue-600"
                      : "border-transparent"
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      activeTab === tab.key ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* --- TAB CONTENT --- */}
        <View className="flex-1">
          {activeTab === "posts" && (
            <>
              {isMyProfile && currentUser && (
                <View className="px-4 shadow-sm mb-4">
                  <CreatePostContainer
                    user={currentUser}
                    onPostCreated={handleAddPost}
                  />
                </View>
              )}
              <View className="px-4 gap-4 pb-10">
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
                  <View className="py-10 items-center bg-white rounded-xl border border-gray-100">
                    <Text className="text-gray-400 text-lg">
                      Chưa có bài viết nào
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
