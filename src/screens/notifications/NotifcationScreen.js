import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getNotifications, markAsRead } from '../../services/notificationService';
import SpinnerLoading from '../../components/SpinnerLoading';
import { API_URL } from '@env';

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

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

export default function NotificationScreen() {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!refreshing) setLoading(true);
        try {
            const result = await getNotifications(1);
            if (result.success) {
                setNotifications(result.data || []);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error("Fetch notifications error:", error);
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [refreshing]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications();
    }, [fetchNotifications]);

    const handleNotificationPress = async (notification) => {
        // Mark as read
        if (!notification.isRead && !notification.read) {
            try {
                await markAsRead(notification._id);
                setNotifications(prev =>
                    prev.map(n =>
                        n._id === notification._id ? { ...n, isRead: true, read: true } : n
                    )
                );
                // Refresh unread count in Header by triggering navigation focus
                // The Header will refetch counts when screen is focused
            } catch (error) {
                console.error("Mark as read error:", error);
            }
        }

        // Navigate based on notification type and data
        const postId = notification.data?.postId || notification.postId;
        const userId = notification.data?.userId || notification.userId;
        
        if (postId) {
            navigation.navigate("DetailPost", { postId });
        } else if (userId) {
            navigation.navigate("Profile", { userId });
        } else if (notification.type === "friend_request" || notification.type === "accepted_request") {
            // Navigate to actor's profile for friend requests
            if (notification.actor?._id) {
                navigation.navigate("Profile", { userId: notification.actor._id });
            }
        }
    };

    const getActorName = (actor) => {
        if (!actor) return "Người dùng";
        return actor.fullName || `${actor.firstName || ''} ${actor.surname || ''}`.trim() || "Người dùng";
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
                <SpinnerLoading />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
                <Text className="text-2xl font-bold text-sky-700">Thông báo</Text>
                <TouchableOpacity className="p-2 rounded-full bg-sky-100">
                    <Ionicons name="settings-outline" size={22} color="#0ea5e9" />
                </TouchableOpacity>
            </View>
            <ScrollView 
                className="px-4 pb-6"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0ea5e9"]} />
                }
            >
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <TouchableOpacity
                            key={notif._id}
                            activeOpacity={0.85}
                            onPress={() => handleNotificationPress(notif)}
                            className={`flex-row items-start gap-3 p-4 bg-white rounded-2xl mb-4 shadow-lg border border-sky-50 ${
                                !notif.isRead && !notif.read ? "bg-blue-50" : ""
                            }`}
                            style={{
                                shadowColor: "#38bdf8",
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: 4,
                            }}
                        >
                            <View className="relative">
                                <Image
                                    source={{ uri: getFullUrl(notif.actor?.avatar) }}
                                    className="w-14 h-14 rounded-full border-2 border-sky-200"
                                />
                                <View className="absolute bottom-0 right-0 bg-white rounded-full p-1">
                                    <Ionicons name="notifications" size={16} color="#0ea5e9" />
                                </View>
                                {(!notif.isRead && !notif.read) && (
                                    <View className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-base text-sky-900">
                                    <Text className="font-bold">{getActorName(notif.actor)} </Text>
                                    <Text className="text-gray-700">{notif.content || notif.message}</Text>
                                </Text>
                                <Text className="text-xs text-gray-400 mt-2">
                                    {formatTime(notif.createdAt)}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#a1a1aa" className="self-center" />
                        </TouchableOpacity>
                    ))
                ) : (
                    <View className="items-center py-24">
                        <View className="bg-sky-100 rounded-full p-6 mb-6">
                            <Ionicons name="notifications-outline" size={48} color="#38bdf8" />
                        </View>
                        <Text className="text-lg font-bold text-sky-700 mb-2">Bạn đã xem hết thông báo</Text>
                        <Text className="text-center text-gray-400 px-8">
                            Hãy quay lại sau để nhận các thông báo mới!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
