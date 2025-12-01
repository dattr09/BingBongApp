import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
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
    ChevronRight
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CreatePostContainer from '../../components/CreatePostContainer';
import SpinnerLoading from '../../components/SpinnerLoading';
import PostCard from '../../components/PostCard';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";

// --- CONFIG & FAKE DATA (GIỮ NGUYÊN) ---
const Config = { BACKEND_URL: '' };
const MY_USER_ID = 'user_123';
const FAKE_ME = {
    _id: MY_USER_ID,
    firstName: 'Nguyễn',
    surname: 'Văn A',
    avatar: 'https://i.pravatar.cc/300?img=11',
    coverPhoto: 'https://picsum.photos/800/400?random=1',
    friends: ['user_456'],
    friendRequests: ['user_789'],
};
const FRIEND_USER_ID = 'user_456';
const FAKE_FRIEND_PROFILE = {
    _id: FRIEND_USER_ID,
    firstName: 'Trần',
    surname: 'Thị B',
    avatar: 'https://i.pravatar.cc/300?img=5',
    coverPhoto: 'https://picsum.photos/800/400?random=2',
    friends: [MY_USER_ID, 'user_999'],
    friendRequests: [],
};
const STRANGER_USER_ID = 'user_999';
const FAKE_STRANGER_PROFILE = {
    _id: STRANGER_USER_ID,
    firstName: 'Lê',
    surname: 'Văn C',
    avatar: 'https://i.pravatar.cc/300?img=8',
    coverPhoto: 'https://picsum.photos/800/400?random=3',
    friends: [],
    friendRequests: [],
};
const useAuthStore = () => ({
    user: FAKE_ME,
    onlineUsers: [FRIEND_USER_ID],
    setAvatar: () => console.log('Fake setAvatar'),
    setCoverPhoto: () => console.log('Fake setCoverPhoto'),
    updateUser: () => console.log('Fake updateUser'),
});
const useGetUserProfile = (userId) => {
    let profileData = FAKE_FRIEND_PROFILE;
    if (userId === MY_USER_ID) profileData = FAKE_ME;
    if (userId === STRANGER_USER_ID) profileData = FAKE_STRANGER_PROFILE;
    return { profile: profileData, loading: false };
};
const useGetUserPosts = (userId) => {
    const [posts, setPosts] = useState([
        {
            _id: 'post_1',
            userId: userId === MY_USER_ID ? FAKE_ME : FAKE_FRIEND_PROFILE,
            content: 'Hôm nay trời đẹp quá! 🌞 #bingbong',
            image: 'https://picsum.photos/600/400?random=4',
            likes: [],
            comments: [],
            createdAt: new Date().toISOString(),
        },
        {
            _id: 'post_2',
            userId: userId === MY_USER_ID ? FAKE_ME : FAKE_FRIEND_PROFILE,
            content: 'Check-in tại quán cà phê mới ☕',
            image: null,
            likes: [],
            comments: [],
            createdAt: new Date(Date.now() - 86400000).toISOString(),
        }
    ]);
    return { posts, setPosts, loading: false };
};
const DeleteFriend = async () => ({ success: true, data: { friends: [] } });
const AddFriendRequest = async () => ({ success: true, message: 'Friend request sent' });
const AcceptFriendRequest = async () => ({ success: true, data: { friends: [FRIEND_USER_ID] } });
const CancelFriendRequest = async () => ({ success: true, message: 'Request cancelled' });
const DeclineFriendRequest = async () => ({ success: true, message: 'Request declined' });

// --- MAIN COMPONENT ---
export default function ProfileScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const userIdFromRoute = route.params?.userId;
    const userId = userIdFromRoute || MY_USER_ID;

    const { user, setAvatar, setCoverPhoto, onlineUsers } = useAuthStore();
    const [isFriend, setIsFriend] = useState(false);
    const [hasSentFriendRequest, setHasSentFriendRequest] = useState(false);
    const [isReceivingFriendRequest, setIsReceivingFriendRequest] = useState(false);
    const [isOpenFriendsDropdown, setIsOpenFriendsDropdown] = useState(false);
    const isMyProfile = userId === user?._id;
    const [userChat, setUserChat] = useState(null);
    const { posts, setPosts, loading: postsLoading } = useGetUserPosts(userId);
    const { profile, loading: profileLoading } = useGetUserProfile(userId);
    const displayProfile = isMyProfile ? user : profile;

    // Logic giữ nguyên
    useEffect(() => {
        if (!user || !profile) return;
        if (!isMyProfile) {
            const isFriendNow = (user.friends || []).includes(profile._id);
            const hasSent = (profile.friendRequests || []).some((r) => r === user._id || r._id === user._id);
            const isReceiving = (user.friendRequests || []).includes(profile._id);
            setIsFriend(isFriendNow);
            setHasSentFriendRequest(hasSent);
            setIsReceivingFriendRequest(isReceiving);
            setUserChat({
                _id: profile._id,
                firstName: profile.firstName,
                surname: profile.surname,
                avatar: profile.avatar,
            });
        }
    }, [user, profile, isMyProfile]);

    const handleDeleteFriend = async () => {
        try {
            const response = await DeleteFriend(userId || '');
            if (!response.success) return;
            setIsFriend(false);
            Toast.show({ type: 'success', text1: 'Friend deleted successfully!' });
        } catch (error) { console.error(error); }
    };
    const handleAddFriendRequest = async () => {
        try {
            const response = await AddFriendRequest(userId || '');
            if (!response.success) return;
            setHasSentFriendRequest(true);
            Toast.show({ type: 'success', text1: 'Friend request sent' });
        } catch (error) { console.error(error); }
    };
    const handleAcceptFriendRequest = async () => {
        try {
            const response = await AcceptFriendRequest(userId || '');
            if (!response.success) return;
            setIsFriend(true);
            setIsReceivingFriendRequest(false);
            Toast.show({ type: 'success', text1: 'Request accepted' });
        } catch (error) { console.error(error); }
    };
    const handleCancelFriendRequest = async () => {
        try {
            const response = await CancelFriendRequest(userId || '');
            if (!response.success) return;
            setHasSentFriendRequest(false);
            Toast.show({ type: 'success', text1: 'Request cancelled' });
        } catch (error) { console.error(error); }
    };
    const handleDeclineFriendRequest = async () => {
        try {
            const response = await DeclineFriendRequest(userId || '');
            if (!response.success) return;
            setIsReceivingFriendRequest(false);
            Toast.show({ type: 'success', text1: 'Request declined' });
        } catch (error) { console.error(error); }
    };
    const pickAvatar = async () => { Toast.show({ type: 'info', text1: 'Fake pick avatar success' }); };
    const pickCoverPhoto = async () => { Toast.show({ type: 'info', text1: 'Fake pick cover photo success' }); };
    const handleAddPost = (newPost) => setPosts((prev) => [newPost, ...prev]);
    const handleRemovePost = (postId) => setPosts((prev) => prev.filter((post) => post._id !== postId));

    if (profileLoading || !user) return <SpinnerLoading />;

    // Helper: Render Action Buttons (Tách ra cho gọn JSX)
    const renderActionButtons = () => {
        if (isMyProfile) {
            return (
                <View className="flex-row items-center justify-center gap-3">
                    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3 shadow-sm shadow-blue-200">
                        <Plus color={'white'} size={18} strokeWidth={2.5} />
                        <Text className="font-bold text-white">Add to Story</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3">
                        <Pencil color={'#374151'} size={18} strokeWidth={2.5} />
                        <Text className="font-bold text-gray-700">Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="items-center justify-center rounded-full bg-gray-100 p-3">
                        <Ellipsis color={'#374151'} />
                    </TouchableOpacity>
                </View>
            );
        }

        if (isFriend) {
            return (
                <View className="flex-row items-center justify-center gap-3 z-10">
                    <View className="relative flex-1">
                        <TouchableOpacity
                            className="flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3 border border-gray-200"
                            onPress={() => setIsOpenFriendsDropdown(!isOpenFriendsDropdown)}
                        >
                            <UserCheck color={'#111827'} size={18} strokeWidth={2.5} />
                            <Text className="font-bold text-gray-900">Friends</Text>
                        </TouchableOpacity>
                        {isOpenFriendsDropdown && (
                            <View className="absolute top-14 left-0 right-0 z-50 rounded-xl bg-white p-2 shadow-lg shadow-gray-300 border border-gray-100">
                                <TouchableOpacity
                                    className="flex-row items-center gap-3 rounded-lg p-3 active:bg-red-50"
                                    onPress={handleDeleteFriend}
                                >
                                    <UserRoundX color={'#ef4444'} size={20} />
                                    <Text className="font-medium text-red-500">Unfriend</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => userChat && navigation.navigate('Chat', { userChat })}
                        className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3 shadow-sm shadow-blue-200"
                    >
                        <MessageCircle color={'white'} size={18} strokeWidth={2.5} />
                        <Text className="font-bold text-white">Message</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (isReceivingFriendRequest) {
            return (
                <View className="flex-col gap-3">
                    <Text className="text-center text-sm text-gray-500 italic">Sent you a friend request</Text>
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-blue-600 py-3"
                            onPress={handleAcceptFriendRequest}
                        >
                            <UserCheck color={'white'} size={18} />
                            <Text className="font-bold text-white">Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-200 py-3"
                            onPress={handleDeclineFriendRequest}
                        >
                            <UserX color={'black'} size={18} />
                            <Text className="font-bold text-black">Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Stranger
        return (
            <View className="flex-row items-center justify-center gap-3">
                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-full py-3 ${hasSentFriendRequest ? 'bg-gray-100' : 'bg-blue-600'}`}
                    onPress={hasSentFriendRequest ? handleCancelFriendRequest : handleAddFriendRequest}
                >
                    <UserPlus color={hasSentFriendRequest ? '#374151' : 'white'} size={18} strokeWidth={2.5} />
                    <Text className={`font-bold ${hasSentFriendRequest ? 'text-gray-700' : 'text-white'}`}>
                        {hasSentFriendRequest ? 'Cancel' : 'Add Friend'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => userChat && navigation.navigate('Chat', { userChat })}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-gray-100 py-3"
                >
                    <MessageCircle color={'#374151'} size={18} strokeWidth={2.5} />
                    <Text className="font-bold text-gray-700">Message</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* --- HEADER SECTION: MODERN & CENTERED --- */}
                <View className="bg-white pb-6 rounded-b-3xl shadow-sm mb-4">
                    {/* Cover Photo */}
                    <View className="relative h-60 w-full">
                        <TouchableOpacity
                            onPress={isMyProfile ? pickCoverPhoto : undefined}
                            activeOpacity={0.9}
                            disabled={!isMyProfile}
                        >
                            <Image
                                source={displayProfile?.coverPhoto ? { uri: displayProfile.coverPhoto.startsWith('http') ? displayProfile.coverPhoto : `${Config.BACKEND_URL}${displayProfile.coverPhoto}` } : { uri: 'https://placehold.co/800x400/e2e8f0/e2e8f0.png' }}
                                className="h-full w-full object-cover"
                            />
                            {isMyProfile && (
                                <View className="absolute bottom-4 right-4 bg-black/30 p-2 rounded-full backdrop-blur-sm">
                                    <Camera color="white" size={20} />
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Avatar Container - Centered and Overlapping */}
                        <View className="absolute -bottom-16 left-0 right-0 items-center">
                            <TouchableOpacity onPress={isMyProfile ? pickAvatar : undefined} activeOpacity={0.9} disabled={!isMyProfile} className="relative">
                                <Image
                                    source={displayProfile?.avatar ? { uri: displayProfile.avatar.startsWith('http') ? displayProfile.avatar : `${Config.BACKEND_URL}${displayProfile.avatar}` } : { uri: 'https://i.pravatar.cc/300?img=1' }}
                                    className="h-32 w-32 rounded-full border-[4px] border-white shadow-sm bg-gray-200"
                                />
                                {/* Online Status */}
                                {((!isMyProfile && onlineUsers.includes(userId)) || isMyProfile) && (
                                    <View className="absolute bottom-1 right-2 h-6 w-6 items-center justify-center rounded-full bg-white border-[3px] border-white">
                                        <View className="h-full w-full rounded-full bg-green-500" />
                                    </View>
                                )}
                                {isMyProfile && (
                                    <View className="absolute bottom-0 right-0 bg-gray-100 p-1.5 rounded-full border-2 border-white">
                                        <Camera color="#374151" size={16} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Profile Info - Centered */}
                    <View className="mt-20 px-4 items-center">
                        <Text className="text-3xl font-extrabold text-gray-900 text-center">
                            {`${displayProfile?.firstName} ${displayProfile?.surname}`}
                        </Text>
                        <Text className="text-gray-500 text-center mt-1 px-8 text-sm leading-5">
                            Life is short. Smile while you still have teeth 😁
                        </Text>

                        {/* Stats Row */}
                        <View className="flex-row items-center gap-6 mt-4 mb-6">
                            <TouchableOpacity className="items-center">
                                <Text className="text-lg font-bold text-gray-900">{displayProfile?.friends?.length || 0}</Text>
                                <Text className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Friends</Text>
                            </TouchableOpacity>
                            <View className="h-8 w-[1px] bg-gray-200" />
                            <TouchableOpacity className="items-center">
                                <Text className="text-lg font-bold text-gray-900">{posts.length}</Text>
                                <Text className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Posts</Text>
                            </TouchableOpacity>
                            <View className="h-8 w-[1px] bg-gray-200" />
                            <TouchableOpacity className="items-center">
                                <Text className="text-lg font-bold text-gray-900">4.5</Text>
                                <Text className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Rating</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Action Buttons Render */}
                        <View className="w-full max-w-sm">
                            {renderActionButtons()}
                        </View>
                    </View>
                </View>

                {/* --- BODY SECTION --- */}

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4" contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
                    {['Posts', 'About', 'Photos', 'Friends', 'Videos'].map((tab, index) => (
                        <TouchableOpacity key={tab} className={`px-5 py-2 rounded-full ${index === 0 ? 'bg-black' : 'bg-white border border-gray-200'}`}>
                            <Text className={`font-semibold ${index === 0 ? 'text-white' : 'text-gray-600'}`}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View className="px-4 gap-4">
                    {/* Intro Card */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-lg font-bold text-gray-900">About</Text>
                            <TouchableOpacity><Text className="text-blue-600 font-medium">See All</Text></TouchableOpacity>
                        </View>
                        <View className="gap-3">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-blue-50 p-2 rounded-full"><GraduationCap size={20} color="#2563eb" /></View>
                                <Text className="text-gray-700 flex-1">Studied at <Text className="font-semibold text-gray-900">Bing Bong University</Text></Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className="bg-red-50 p-2 rounded-full"><MapPin size={20} color="#dc2626" /></View>
                                <Text className="text-gray-700 flex-1">From <Text className="font-semibold text-gray-900">Ho Chi Minh City, Vietnam</Text></Text>
                            </View>
                            <View className="flex-row items-center gap-3">
                                <View className="bg-gray-100 p-2 rounded-full"><Ellipsis size={20} color="#4b5563" /></View>
                                <Text className="text-gray-500 italic">More info about {displayProfile?.firstName}...</Text>
                            </View>
                        </View>
                    </View>

                    {/* Friends Card - Clean Grid */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <View className="flex-row justify-between items-center mb-4">
                            <View>
                                <Text className="text-lg font-bold text-gray-900">Friends</Text>
                                <Text className="text-xs text-gray-500">{displayProfile?.friends?.length || 0} connections</Text>
                            </View>
                            <TouchableOpacity className="flex-row items-center">
                                <Text className="text-blue-600 font-medium mr-1">Find Friends</Text>
                                <ChevronRight size={16} color="#2563eb" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row flex-wrap gap-2">
                            {profile?.friends && profile.friends.length > 0 ? (
                                Array.from({ length: 3 }).map((_, i) => ( // Giả lập hiển thị 3 bạn bè cho đẹp grid
                                    <View key={i} className="w-[31%] mb-2">
                                        <TouchableOpacity>
                                            <Image
                                                source={{ uri: `https://i.pravatar.cc/300?img=${10 + i}` }}
                                                className="h-28 w-full rounded-xl bg-gray-100 mb-2"
                                            />
                                            <Text className="text-sm font-semibold text-gray-900 text-center" numberOfLines={1}>User {i + 1}</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <View className="w-full py-4 items-center bg-gray-50 rounded-lg">
                                    <Text className="text-gray-400">No friends to display yet.</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity className="mt-2 w-full bg-gray-100 py-3 rounded-xl items-center">
                            <Text className="font-semibold text-gray-700">View All Friends</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Posts Header */}
                    <View className="flex-row justify-between items-end mt-2">
                        <Text className="text-xl font-bold text-gray-900">Posts</Text>
                        <TouchableOpacity><Text className="text-blue-600 font-medium">Filters</Text></TouchableOpacity>
                    </View>

                    {/* Create Post Input */}
                    <View className="shadow-sm">
                        <CreatePostContainer onPostCreated={handleAddPost} />
                    </View>

                    {/* Posts List */}
                    <View className="pb-10 gap-4">
                        {postsLoading ? (
                            <SpinnerLoading />
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                // Wrap PostCard để thêm shadow/border radius nếu component gốc chưa có
                                <View key={post._id} className="overflow-hidden">
                                    <PostCard post={post} onDeletePost={handleRemovePost} />
                                </View>
                            ))
                        ) : (
                            <View className="py-10 items-center">
                                <Text className="text-gray-400 text-lg">No posts available</Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}