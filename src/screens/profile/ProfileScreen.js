import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, Pressable, ScrollView, RefreshControl } from 'react-native';
import { GraduationCap, MapPin, Pencil, Plus, UserCheck, UserPlus, UserRoundX, MessageCircle, Camera } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from 'react-native-toast-message';
import { API_URL } from "@env";
// Components
import CreatePostContainer from '../../components/CreatePostContainer';
import SpinnerLoading from '../../components/SpinnerLoading';
import PostCard from '../../components/PostCard';

// Services
import { getUserProfile } from '../../services/profileService';
import { getUserPosts } from '../../services/postService'; // bạn nên có API lấy posts của user
export default function ProfileScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { userId } = route.params || {};

    const [currentUser, setCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOpenFriendsDropdown, setIsOpenFriendsDropdown] = useState(false);

    const pressStyle = ({ pressed }) => ({ opacity: pressed ? 0.7 : 1 });

    const getAvatarUrl = (url) => {
        if (!url) return 'https://i.pravatar.cc/300?img=1';
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    const getCoverUrl = (url) => {
        if (!url) return 'https://placehold.co/800x400/e2e8f0/e2e8f0.png';
        if (url.startsWith('http')) return url;
        return `${API_URL}${url}`;
    };

    const fetchProfileData = useCallback(async () => {
        try {
            setLoading(true);
            const storedUser = await AsyncStorage.getItem("user");
            const me = storedUser ? JSON.parse(storedUser) : null;
            setCurrentUser(me);

            const result = await getUserProfile(userId);
            if (result.success) {
                setProfile(result.data);
                // --- LẤY POSTS CỦA USER ---
                if (result.data._id) {
                    const postsResult = await getUserPosts(result.data._id);
                   // console.log("User Posts Result:", postsResult);
                    if (postsResult.success) setPosts(postsResult.data || []);
                    else setPosts([]);
                }
            } else {
                console.log("Get Profile Failed:", result.message);
            }
        } catch (error) {
            console.error("ProfileScreen Error:", error);
            Toast.show({ type: 'error', text1: 'Lỗi kết nối' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProfileData();
    };

    const isMyProfile = currentUser && (!userId || (profile && currentUser._id === profile._id));

    const isFriend = !isMyProfile && profile?.friends && currentUser &&
        (profile.friends.includes(currentUser._id) || profile.friends.some(f => f._id === currentUser._id));

    const hasSentFriendRequest = !isMyProfile && profile?.friendRequests && currentUser &&
        (profile.friendRequests.includes(currentUser._id) || profile.friendRequests.some(req => req._id === currentUser._id));

    const handleAddPost = (newPost) => setPosts((prev) => [newPost, ...prev]);
    const handleRemovePost = (postId) => setPosts((prev) => prev.filter((post) => post._id !== postId));

    const renderActionButtons = () => {
        if (isMyProfile) {
            return (
                <View className="flex-row items-center justify-center gap-3">
                    <Pressable style={pressStyle} className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3">
                        <Plus color={'white'} size={18} strokeWidth={2.5} />
                        <Text className="font-bold text-white">Add to Story</Text>
                    </Pressable>
                    <Pressable style={pressStyle} className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3">
                        <Pencil color={'#374151'} size={18} strokeWidth={2.5} />
                        <Text className="font-bold text-gray-700">Edit Profile</Text>
                    </Pressable>
                </View>
            );
        }

        if (isFriend) {
            return (
                <View className="flex-row items-center justify-center gap-3 z-10">
                    <Pressable
                        style={pressStyle}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3 border border-gray-200"
                        onPress={() => setIsOpenFriendsDropdown(!isOpenFriendsDropdown)}
                    >
                        <UserCheck color={'#111827'} size={18} strokeWidth={2.5} />
                        <Text className="font-bold text-gray-900">Friends</Text>
                    </Pressable>
                    {isOpenFriendsDropdown && (
                        <View className="absolute top-14 left-0 right-0 z-50 rounded-xl bg-white p-2 shadow-lg shadow-gray-300 border border-gray-100">
                            <Pressable style={pressStyle} className="flex-row items-center gap-3 rounded-lg p-3"
                                onPress={() => Toast.show({type: 'info', text1: 'Chức năng Unfriend đang phát triển'})}>
                                <UserRoundX color={'#ef4444'} size={20} />
                                <Text className="font-medium text-red-500">Unfriend</Text>
                            </Pressable>
                        </View>
                    )}
                    <Pressable
                        style={pressStyle}
                        onPress={() => navigation.navigate('Chat', { userChat: profile })}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3"
                    >
                        <MessageCircle color={'white'} size={18} strokeWidth={2.5} />
                        <Text className="font-bold text-white">Message</Text>
                    </Pressable>
                </View>
            );
        }

        return (
            <View className="flex-row items-center justify-center gap-3">
                <Pressable
                    style={pressStyle}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-full py-3 ${hasSentFriendRequest ? 'bg-gray-100' : 'bg-blue-600'}`}
                    onPress={() => Toast.show({type: 'info', text1: 'Chức năng kết bạn đang phát triển'})}
                >
                    <UserPlus color={hasSentFriendRequest ? '#374151' : 'white'} size={18} strokeWidth={2.5} />
                    <Text className={`font-bold ${hasSentFriendRequest ? 'text-gray-700' : 'text-white'}`}>
                        {hasSentFriendRequest ? 'Cancel' : 'Add Friend'}
                    </Text>
                </Pressable>
                <Pressable
                    style={pressStyle}
                    onPress={() => navigation.navigate('Chat', { userChat: profile })}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3"
                >
                    <MessageCircle color={'#374151'} size={18} strokeWidth={2.5} />
                    <Text className="font-bold text-gray-700">Message</Text>
                </Pressable>
            </View>
        );
    };

    if (loading) return <SpinnerLoading />;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
            >
                {/* --- HEADER SECTION --- */}
                <View className="bg-white pb-6 rounded-b-3xl shadow-sm mb-4">
                    <View className="relative h-60 w-full">
                        <Image
                            source={{ uri: getCoverUrl(profile.coverPhoto) }}
                            className="h-full w-full object-cover"
                        />
                        <View className="absolute -bottom-16 left-0 right-0 items-center">
                            <Image
                                source={{ uri: getAvatarUrl(profile.avatar) }}
                                className="h-32 w-32 rounded-full border-[4px] border-white shadow-sm bg-gray-200"
                            />
                        </View>
                    </View>

                    <View className="mt-20 px-4 items-center">
                        <Text className="text-3xl font-extrabold text-gray-900 text-center">{profile.fullName}</Text>
                        <Text className="text-gray-500 text-center mt-1 px-8 text-sm leading-5">{profile.bio || 'Chưa có tiểu sử.'}</Text>
                        <View className="flex-row items-center gap-6 mt-4 mb-6">
                            <Text className="text-lg font-bold text-gray-900">{profile.friends?.length || 0} Friends</Text>
                            <Text className="text-lg font-bold text-gray-900">{posts.length} Posts</Text>
                        </View>
                        <View className="w-full max-w-sm">{renderActionButtons()}</View>
                    </View>
                </View>

                {/* --- CREATE POST & POSTS --- */}
                {isMyProfile && currentUser && (
                    <View className="px-4 shadow-sm">
                        <CreatePostContainer user={currentUser} onPostCreated={handleAddPost} />
                    </View>
                )}
                <View className="px-4 gap-4 pb-10">
                    {posts.length > 0 ? posts.map((post) => (
                        <PostCard key={post._id} post={post} currentUser={currentUser} onDeletePost={handleRemovePost} />
                    )) : (
                        <View className="py-10 items-center bg-white rounded-xl border border-gray-100">
                            <Text className="text-gray-400 text-lg">Chưa có bài viết nào</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
