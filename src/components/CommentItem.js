import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CommentInput from './CommentInput';
import { useThemeSafe } from '../utils/themeHelper';

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getUserName = (user) => {
  if (!user) return "User";
  return user.fullName || `${user.firstName || ''} ${user.surname || ''}`.trim() || user.name || "User";
};

export default function CommentItem({ comment, onReply, currentUser, getFullUrl }) {
    const { colors } = useThemeSafe();
    const [openReplies, setOpenReplies] = useState(false);
    const [replying, setReplying] = useState(false);

    const handleReply = async (text) => {
        if (onReply) await onReply(comment._id, text);
        setReplying(false);
        setOpenReplies(true);
    };

    const user = comment.user || comment.author || {};
    const avatarUrl = getFullUrl ? getFullUrl(user.avatar) : (user.avatar || 'https://i.pravatar.cc/100');
    const isAuthor = comment.isAuthor || (currentUser && user._id === currentUser._id);
    const replies = comment.replies || [];

    return (
        <View className="mb-4 w-full flex-row gap-3">
            {/* Avatar với border gradient */}
            <View className="relative">
                <Image
                    source={{ uri: avatarUrl }}
                    className="h-12 w-12 rounded-full"
                    style={{ borderWidth: 2.5, borderColor: colors.primary + '30' }}
                />
                {isAuthor && (
                    <View 
                        className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 items-center justify-center"
                        style={{ backgroundColor: colors.primary, borderColor: colors.card }}
                    >
                        <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                )}
            </View>

            <View className="flex-1">
                {/* Comment bubble với shadow và border */}
                <View 
                    className="rounded-2xl px-4 py-3 shadow-sm"
                    style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                >
                    <View className="flex-row items-center gap-2 mb-2">
                        <Text className="font-bold text-base" style={{ color: colors.text }}>{getUserName(user)}</Text>
                        {isAuthor && (
                            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: colors.primary + '20' }}>
                                <Text className="text-xs font-semibold" style={{ color: colors.primary }}>Author</Text>
                            </View>
                        )}
                        <Text className="text-xs" style={{ color: colors.textTertiary }}>
                            {formatTime(comment.createdAt || comment.time)}
                        </Text>
                    </View>
                    <Text className="text-base leading-5" style={{ color: colors.text }}>{comment.content}</Text>
                </View>

                {/* Action buttons */}
                <View className="flex-row items-center gap-5 mt-2 ml-1">
                    <TouchableOpacity 
                        onPress={() => setReplying(!replying)}
                        className="flex-row items-center gap-1"
                        activeOpacity={0.7}
                    >
                        <Ionicons 
                            name={replying ? "close-circle" : "chatbubble-outline"} 
                            size={16} 
                            color={replying ? colors.error : colors.primary} 
                        />
                        <Text className="text-xs font-semibold" style={{ color: replying ? colors.error : colors.primary }}>
                            {replying ? 'Cancel' : 'Reply'}
                        </Text>
                    </TouchableOpacity>
                    {replies.length > 0 && (
                        <TouchableOpacity 
                            onPress={() => setOpenReplies((s) => !s)}
                            className="flex-row items-center gap-1"
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name={openReplies ? "chevron-up" : "chevron-down"} 
                                size={16} 
                                color={colors.textSecondary} 
                            />
                            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>
                                {openReplies
                                    ? 'Hide replies'
                                    : `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Replies list */}
                {openReplies && replies.length > 0 && (
                    <View className="mt-3 ml-2 pl-3 space-y-3" style={{ borderLeftWidth: 2, borderLeftColor: colors.border }}>
                        {replies.map((r) => {
                            const replyUser = r.user || r.author || {};
                            const replyAvatarUrl = getFullUrl ? getFullUrl(replyUser.avatar) : (replyUser.avatar || 'https://i.pravatar.cc/100');
                            return (
                                <View key={r._id || r.id} className="flex-row gap-2">
                                    <Image
                                        source={{ uri: replyAvatarUrl }}
                                        className="h-9 w-9 rounded-full"
                                        style={{ borderWidth: 2, borderColor: colors.border }}
                                    />
                                    <View className="flex-1">
                                        <View 
                                            className="rounded-xl px-3 py-2"
                                            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                                        >
                                            <View className="flex-row items-center gap-2 mb-1">
                                                <Text className="font-semibold text-sm" style={{ color: colors.text }}>{getUserName(replyUser)}</Text>
                                                <Text className="text-xs" style={{ color: colors.textTertiary }}>
                                                    {formatTime(r.createdAt || r.time)}
                                                </Text>
                                            </View>
                                            <Text className="text-sm leading-4" style={{ color: colors.text }}>{r.content}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Reply input */}
                {replying && (
                    <View className="mt-3">
                        <CommentInput
                            placeholder={`Reply to ${getUserName(user)}...`}
                            onSubmit={handleReply}
                            currentUser={currentUser}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}
