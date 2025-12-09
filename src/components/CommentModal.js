import React, { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import SpinnerLoading from './SpinnerLoading';
import { useThemeSafe } from '../utils/themeHelper';
import { getComments, addComment, addReply } from '../services/postService';
import { API_URL } from '@env';

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function CommentModal({ visible, onClose, postId, currentUser }) {
    const { colors } = useThemeSafe();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'relevant'

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
                const commentsData = result.data || [];
                // Sort comments
                const sorted = [...commentsData].sort((a, b) => {
                    if (sortBy === 'newest') {
                        return new Date(b.createdAt || b.time || 0) - new Date(a.createdAt || a.time || 0);
                    }
                    return 0; // relevant - keep original order
                });
                setComments(sorted);
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
            <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
                {/* Header với gradient background */}
                <View 
                    className="shadow-sm"
                    style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                    <View className="flex-row items-center justify-between px-4 py-4">
                        <View className="flex-row items-center gap-3">
                            <View className="h-10 w-1 rounded-full" style={{ backgroundColor: colors.primary }} />
                            <Text className="text-2xl font-bold" style={{ color: colors.text }}>Comments</Text>
                            {comments.length > 0 && (
                                <View className="px-2 py-1 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                                    <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{comments.length}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            className="p-2 rounded-full"
                            style={{ backgroundColor: colors.surface }}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Sort filter */}
                    <View className="flex-row items-center px-4 pb-3 gap-3">
                        <Text className="text-sm font-medium" style={{ color: colors.textSecondary }}>Sort by:</Text>
                        <TouchableOpacity 
                            onPress={() => {
                                setSortBy('relevant');
                                fetchComments();
                            }}
                            className="px-4 py-2 rounded-full"
                            style={{ backgroundColor: sortBy === 'relevant' ? colors.primary + '20' : colors.surface }}
                            activeOpacity={0.7}
                        >
                            <Text className="text-xs font-semibold" style={{ color: sortBy === 'relevant' ? colors.primary : colors.textSecondary }}>
                                Most relevant
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => {
                                setSortBy('newest');
                                fetchComments();
                            }}
                            className="px-4 py-2 rounded-full"
                            style={{ backgroundColor: sortBy === 'newest' ? colors.primary + '20' : colors.surface }}
                            activeOpacity={0.7}
                        >
                            <Text className="text-xs font-semibold" style={{ color: sortBy === 'newest' ? colors.primary : colors.textSecondary }}>
                                Newest
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Comments list */}
                {loading ? (
                    <View className="flex-1">
                        <SpinnerLoading />
                    </View>
                ) : (
                    <ScrollView 
                        className="flex-1" 
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        style={{ backgroundColor: colors.background }}
                    >
                        {comments.length === 0 ? (
                            <View className="items-center justify-center mt-20">
                                <View className="rounded-full p-6 mb-4" style={{ backgroundColor: colors.surface }}>
                                    <Ionicons name="chatbubble-outline" size={48} color={colors.textTertiary} />
                                </View>
                                <Text className="text-lg font-semibold mb-2" style={{ color: colors.textSecondary }}>
                                    No comments yet
                                </Text>
                                <Text className="text-sm text-center" style={{ color: colors.textTertiary }}>
                                    Be the first to comment!
                                </Text>
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

                {/* Input với fixed position */}
                <View 
                    className="absolute bottom-0 left-0 right-0 px-4 py-3 shadow-lg"
                    style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}
                >
                    <CommentInput 
                        placeholder="Write a public comment..." 
                        onSubmit={handleAddComment}
                        currentUser={currentUser}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
}
