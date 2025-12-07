import React, { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import SpinnerLoading from './SpinnerLoading';
import { getComments, addComment, addReply } from '../services/postService';
import { API_URL } from '@env';

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function CommentModal({ visible, onClose, postId, currentUser }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (visible && postId) {
            fetchComments();
        }
    }, [visible, postId]);

    const fetchComments = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const result = await getComments(postId);
            if (result.success) {
                setComments(result.data || []);
            } else {
                setComments([]);
            }
        } catch (error) {
            console.error("Fetch comments error:", error);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (text) => {
        if (!text.trim() || !postId) return;
        setSubmitting(true);
        try {
            const result = await addComment(postId, text);
            if (result.success) {
                // Refresh comments
                await fetchComments();
            }
        } catch (error) {
            console.error("Add comment error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (commentId, text) => {
        if (!text.trim()) return;
        setSubmitting(true);
        try {
            const result = await addReply(commentId, text);
            if (result.success) {
                // Refresh comments
                await fetchComments();
            }
        } catch (error) {
            console.error("Add reply error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
            <View className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
                {/* Header */}
                <View className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-white/90 rounded-b-3xl shadow-lg">
                    <Text className="text-2xl font-extrabold text-sky-700 tracking-wide">Bình luận</Text>
                    <TouchableOpacity
                        className="p-2 rounded-full bg-sky-100"
                        onPress={onClose}
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
                {loading ? (
                    <View className="flex-1">
                        <SpinnerLoading />
                    </View>
                ) : (
                    <ScrollView className="flex-1 px-2 pt-2" contentContainerStyle={{ paddingBottom: 24 }}>
                        {comments.length === 0 ? (
                            <View className="items-center mt-16">
                                <Text className="text-sky-400 text-lg font-semibold">Chưa có bình luận nào</Text>
                            </View>
                        ) : (
                            comments.map((c) => (
                                <CommentItem 
                                    key={c._id} 
                                    comment={c} 
                                    onReply={handleReply}
                                    currentUser={currentUser}
                                    getFullUrl={getFullUrl}
                                />
                            ))
                        )}
                    </ScrollView>
                )}

                {/* Input */}
                <View className="border-t border-sky-100 py-2 px-2 bg-white/95 shadow-2xl">
                    <CommentInput 
                        placeholder="Viết bình luận công khai..." 
                        onSubmit={handleAddComment}
                        disabled={submitting}
                    />
                </View>
            </View>
        </Modal>
    );
}
