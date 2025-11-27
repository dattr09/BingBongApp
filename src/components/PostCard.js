import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CommentModalDemo from './CommentModal'; // Thêm dòng này

// Dummy data
const dummyPost = {
    _id: '1',
    author: {
        _id: 'u1',
        firstName: 'Alice',
        surname: 'Smith',
        avatar: 'https://i.pravatar.cc/100?img=2',
    },
    createdAt: '2025-11-26T12:00:00Z',
    content: 'Hôm nay mình vừa thử viết một bài post demo UI trên mobile app!',
    images: [
        'https://picsum.photos/400/200',
        'https://picsum.photos/401/200',
        'https://picsum.photos/402/200',
        'https://picsum.photos/403/200',
        'https://picsum.photos/404/200',
    ],
    reactions: [
        { user: { _id: 'u2' }, type: 'Like' },
        { user: { _id: 'u3' }, type: 'Love' },
    ],
    comments: [
        { _id: 'c1', content: 'Bài viết hay quá!' },
        { _id: 'c2', content: 'Mình cũng muốn thử.' },
    ],
};

const emotions = [
    { id: 1, name: 'Like', icon: { uri: 'https://img.icons8.com/emoji/48/000000/thumbs-up.png' }, color: 'blue' },
    { id: 2, name: 'Love', icon: { uri: 'https://img.icons8.com/emoji/48/000000/red-heart.png' }, color: 'red' },
    { id: 3, name: 'Haha', icon: { uri: 'https://img.icons8.com/emoji/48/000000/face-with-tears-of-joy.png' }, color: 'yellow' },
];

export default function PostCard() {
    const [showEmotionBar, setShowEmotionBar] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageIdx, setSelectedImageIdx] = useState(0);
    const [showCommentModal, setShowCommentModal] = useState(false); // Thêm state này

    const openImageModal = (idx) => {
        setSelectedImageIdx(idx);
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
    };

    const nextImage = () => {
        setSelectedImageIdx((prev) =>
            prev < dummyPost.images.length - 1 ? prev + 1 : 0
        );
    };

    const prevImage = () => {
        setSelectedImageIdx((prev) =>
            prev > 0 ? prev - 1 : dummyPost.images.length - 1
        );
    };

    return (
        <View className="w-full bg-white rounded-3xl shadow-2xl mb-6 overflow-hidden border border-sky-100 mx-1">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 bg-gradient-to-r from-sky-100 to-cyan-100">
                <View className="flex-row items-center gap-3">
                    <Image
                        source={{ uri: dummyPost.author.avatar }}
                        className="h-14 w-14 rounded-full border-2 border-sky-200"
                    />
                    <View>
                        <Text className="text-lg font-bold text-sky-900">{`${dummyPost.author.firstName} ${dummyPost.author.surname}`}</Text>
                        <View className="flex-row items-center gap-1 mt-1">
                            <Text className="text-xs text-gray-500">
                                {new Date(dummyPost.createdAt).toLocaleString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </Text>
                            <Ionicons name="earth" size={13} color="#38bdf8" />
                        </View>
                    </View>
                </View>
                <TouchableOpacity className="p-2 rounded-full bg-sky-100">
                    <Ionicons name="ellipsis-horizontal" size={22} color="#0ea5e9" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <Text className="px-5 py-3 text-base text-gray-800">{dummyPost.content}</Text>

            {/* Images grid */}
            {dummyPost.images.length > 0 && (
                <View className="flex-row flex-wrap px-2 pb-2 gap-2">
                    {dummyPost.images.slice(0, 4).map((img, idx) => (
                        <TouchableOpacity
                            key={idx}
                            className={`overflow-hidden rounded-2xl bg-gray-100 ${dummyPost.images.length === 1 ? 'w-full h-60' : 'w-[48%] h-36'}`}
                            activeOpacity={0.93}
                            onPress={() => openImageModal(idx)}
                        >
                            <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                            {idx === 3 && dummyPost.images.length > 4 && (
                                <View className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40">
                                    <Text className="text-2xl font-bold text-white">+{dummyPost.images.length - 4}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Modal xem ảnh với chuyển ảnh và nền trắng mờ */}
            <Modal
                visible={showImageModal}
                transparent
                animationType="fade"
                onRequestClose={closeImageModal}
            >
                <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.92)' }}>
                    <View className="relative">
                        <Image
                            source={{ uri: dummyPost.images[selectedImageIdx] }}
                            style={{
                                width: Dimensions.get('window').width * 0.92,
                                height: Dimensions.get('window').width * 0.92 * 0.6,
                                borderRadius: 24,
                                resizeMode: 'contain',
                            }}
                        />
                        {/* Nút chuyển trái */}
                        {dummyPost.images.length > 1 && (
                            <TouchableOpacity
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2"
                                onPress={prevImage}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="chevron-back" size={32} color="#0ea5e9" />
                            </TouchableOpacity>
                        )}
                        {/* Nút chuyển phải */}
                        {dummyPost.images.length > 1 && (
                            <TouchableOpacity
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2"
                                onPress={nextImage}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="chevron-forward" size={32} color="#0ea5e9" />
                            </TouchableOpacity>
                        )}
                        {/* Đóng */}
                        <TouchableOpacity
                            onPress={closeImageModal}
                            className="absolute -top-8 right-0 bg-white rounded-full p-2 shadow-lg"
                        >
                            <Ionicons name="close" size={28} color="#0ea5e9" />
                        </TouchableOpacity>
                    </View>
                    {/* Chỉ số ảnh */}
                    <View className="flex-row items-center justify-center mt-4">
                        {dummyPost.images.map((_, idx) => (
                            <View
                                key={idx}
                                className={`mx-1 w-2.5 h-2.5 rounded-full ${idx === selectedImageIdx ? 'bg-sky-500' : 'bg-sky-200'}`}
                            />
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Reactions & Comments */}
            <View className="flex-row items-center justify-between px-5 py-2">
                <View className="flex-row items-center gap-1">
                    {dummyPost.reactions.map((r, i) => (
                        <Image
                            key={i}
                            source={emotions.find((e) => e.name === r.type).icon}
                            className="-ml-2 h-5 w-5"
                        />
                    ))}
                    <Text className="text-sm text-gray-600 ml-2">{dummyPost.reactions.length} lượt cảm xúc</Text>
                </View>
                <Text className="text-sm text-gray-500">{dummyPost.comments.length} bình luận</Text>
            </View>

            {/* Action buttons */}
            <View className="flex-row border-t border-sky-100">
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 py-3"
                    onLongPress={() => setShowEmotionBar(true)}
                >
                    <Ionicons name="thumbs-up-outline" size={22} color="#38bdf8" />
                    <Text className="text-base text-sky-700 font-semibold">Thích</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 py-3"
                    onPress={() => setShowCommentModal(true)} // Mở modal khi bấm
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#38bdf8" />
                    <Text className="text-base text-sky-700 font-semibold">Bình luận</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-2 py-3">
                    <Ionicons name="arrow-redo-outline" size={22} color="#38bdf8" />
                    <Text className="text-base text-sky-700 font-semibold">Chia sẻ</Text>
                </TouchableOpacity>
            </View>

            {/* Emotion bar (demo) */}
            {showEmotionBar && (
                <View className="absolute -top-16 left-8 z-20 flex-row items-center bg-white p-2 rounded-2xl shadow-xl border border-sky-100">
                    {emotions.map((emo) => (
                        <TouchableOpacity key={emo.id} className="mx-1">
                            <Image source={emo.icon} className="h-10 w-10" />
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Comments preview */}
            <View className="px-5 pb-4 pt-2">
                {dummyPost.comments.slice(0, 2).map((cmt, idx) => (
                    <View key={cmt._id} className="flex-row items-start gap-2 mb-2">
                        <Ionicons name="person-circle-outline" size={22} color="#38bdf8" />
                        <View className="bg-sky-50 rounded-xl px-3 py-2 flex-1">
                            <Text className="text-sm text-gray-800">{cmt.content}</Text>
                        </View>
                    </View>
                ))}
                <TouchableOpacity onPress={() => setShowCommentModal(true)}>
                    <Text className="text-sky-600 text-sm font-semibold mt-1">Xem tất cả bình luận</Text>
                </TouchableOpacity>
            </View>

            {/* Hiển thị CommentModal */}
            {showCommentModal && (
                <CommentModalDemo />
            )}
        </View>
    );
}
