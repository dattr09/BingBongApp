import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import CommentInput from './CommentInput';

const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getUserName = (user) => {
  if (!user) return "Người dùng";
  return user.fullName || `${user.firstName || ''} ${user.surname || ''}`.trim() || user.name || "Người dùng";
};

export default function CommentItem({ comment, onReply, currentUser, getFullUrl }) {
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
        <View className="mb-5 w-full flex-row gap-3">
            {/* Avatar lớn, viền xanh, bóng nhẹ */}
            <Image
                source={{ uri: avatarUrl }}
                className="h-12 w-12 rounded-full border-2 border-sky-200 shadow"
            />

            <View className="flex-1">
                {/* Bong bóng comment bo góc lớn, nền trắng, bóng, border xanh nhạt */}
                <View className="rounded-2xl bg-white px-4 py-3 shadow border border-sky-50">
                    <View className="flex-row items-center gap-2 mb-1">
                        <Text className="font-bold text-sky-900">{getUserName(user)}</Text>
                        {isAuthor && (
                            <Text className="text-xs text-sky-500 ml-1 bg-sky-50 px-2 py-0.5 rounded-full font-semibold">Tác giả</Text>
                        )}
                        <Text className="text-xs text-gray-400 ml-2">
                            {formatTime(comment.createdAt || comment.time)}
                        </Text>
                    </View>
                    <Text className="text-base text-gray-800">{comment.content}</Text>
                </View>

                {/* Hành động */}
                <View className="flex-row items-center gap-4 mt-2 ml-1">
                    <TouchableOpacity onPress={() => setReplying(true)}>
                        <Text className="text-xs text-sky-600 font-semibold">Trả lời</Text>
                    </TouchableOpacity>
                    {replies.length > 0 && (
                        <TouchableOpacity onPress={() => setOpenReplies((s) => !s)}>
                            <Text className="text-xs text-sky-400 font-semibold">
                                {openReplies
                                    ? 'Ẩn phản hồi'
                                    : `Xem ${replies.length} phản hồi`}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Danh sách phản hồi */}
                {openReplies && replies.map((r) => {
                    const replyUser = r.user || r.author || {};
                    const replyAvatarUrl = getFullUrl ? getFullUrl(replyUser.avatar) : (replyUser.avatar || 'https://i.pravatar.cc/100');
                    return (
                        <View key={r._id || r.id} className="mt-3 flex-row gap-2 ml-4">
                            <Image
                                source={{ uri: replyAvatarUrl }}
                                className="h-9 w-9 rounded-full border border-sky-100"
                            />
                            <View className="flex-1">
                                <View className="rounded-2xl bg-sky-50 px-3 py-2 border border-sky-100">
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <Text className="font-semibold text-sky-900">{getUserName(replyUser)}</Text>
                                        <Text className="text-xs text-gray-400">
                                            {formatTime(r.createdAt || r.time)}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-800">{r.content}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Input trả lời */}
                {replying && (
                    <View className="mt-3 ml-1">
                        <CommentInput
                            placeholder={`Phản hồi ${comment.user.name}...`}
                            onSubmit={handleReply}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}
