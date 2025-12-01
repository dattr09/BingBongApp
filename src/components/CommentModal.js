import React, { useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';

// Dummy data
const DUMMY_COMMENTS = [
    {
        _id: 'c1',
        user: { name: 'Alice Nguyen', avatar: 'https://i.pravatar.cc/100?img=2' },
        content: 'Bài viết rất hữu ích — cảm ơn bạn!',
        time: '2h',
        isAuthor: false,
        replies: [
            { id: 'r1', user: { name: 'Author', avatar: 'https://i.pravatar.cc/100?img=1' }, content: 'Cảm ơn bạn!', time: '1h' }
        ]
    },
    {
        _id: 'c2',
        user: { name: 'Binh Tran', avatar: 'https://i.pravatar.cc/100?img=3' },
        content: 'Mình đã thử theo hướng dẫn và thành công 🙂',
        time: '3h',
        isAuthor: true,
        replies: []
    }
];

export default function CommentModalDemo() {
    const [visible, setVisible] = useState(true);
    const [comments, setComments] = useState(DUMMY_COMMENTS);

    const handleClose = () => setVisible(false);

    const handleAddComment = async (text) => {
        const newComment = {
            _id: Math.random().toString(),
            user: { name: 'You', avatar: 'https://i.pravatar.cc/100' },
            content: text,
            time: 'Vừa xong',
            isAuthor: false,
            replies: []
        };
        setComments((prev) => [newComment, ...prev]);
    };

    const handleReply = async (commentId, text) => {
        setComments((prev) =>
            prev.map((c) =>
                c._id === commentId
                    ? { ...c, replies: [...(c.replies || []), { id: Math.random().toString(), user: { name: 'You', avatar: 'https://i.pravatar.cc/100' }, content: text, time: 'Vừa xong' }] }
                    : c
            )
        );
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
            <View className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
                {/* Header mới */}
                <View className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-white/90 rounded-b-3xl shadow-lg">
                    <Text className="text-2xl font-extrabold text-sky-700 tracking-wide">Bình luận</Text>
                    <TouchableOpacity
                        className="p-2 rounded-full bg-sky-100"
                        onPress={handleClose}
                        activeOpacity={0.8}
                    >
                        <X size={24} color="#0ea5e9" />
                    </TouchableOpacity>
                </View>

                {/* Bộ lọc */}
                <View className="flex-row items-center px-4 py-2 bg-white/80 border-b border-sky-100">
                    <Text className="text-sm text-sky-700 font-semibold mr-4">Sắp xếp:</Text>
                    <TouchableOpacity className="px-3 py-1 rounded-full bg-sky-100 mr-2">
                        <Text className="text-xs text-sky-700 font-bold">Liên quan nhất</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="px-3 py-1 rounded-full bg-gray-100">
                        <Text className="text-xs text-gray-500 font-semibold">Mới nhất</Text>
                    </TouchableOpacity>
                </View>

                {/* Danh sách bình luận */}
                <ScrollView className="flex-1 px-2 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
                    {comments.length === 0 ? (
                        <View className="items-center mt-16">
                            <Text className="text-sky-400 text-lg font-semibold">Chưa có bình luận nào</Text>
                        </View>
                    ) : (
                        comments.map((c) => (
                            <CommentItem key={c._id} comment={c} onReply={handleReply} />
                        ))
                    )}
                </ScrollView>

                {/* Input */}
                <View className="border-t border-sky-100 py-2 px-2 bg-white/95 shadow-2xl">
                    <CommentInput placeholder="Viết bình luận công khai..." onSubmit={handleAddComment} />
                </View>
            </View>
        </Modal>
    );
}