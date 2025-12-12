import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';
import SpinnerLoading from '../../components/SpinnerLoading';
import { useThemeSafe } from '../../utils/themeHelper';
import { getFullUrl } from '../../utils/getPic';

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
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function NotificationScreen() {
    const navigation = useNavigation();
    const { colors } = useThemeSafe();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async (shouldMarkAsRead = false) => {
        if (!refreshing) setLoading(true);
        try {
            const result = await getNotifications(1);
            if (result.success) {
            const notifications = result.data || [];
            setNotifications(notifications);
            
            if (shouldMarkAsRead && notifications.some(n => !n.isRead && !n.read)) {
                try {
                    await markAllAsRead();
                    setNotifications(prev => 
                        prev.map(n => ({ ...n, isRead: true, read: true }))
                    );
                    } catch (error) {
                        console.error("Mark all as read error:", error);
                    }
                }
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
        fetchNotifications(true);
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchNotifications(false);
    }, [fetchNotifications]);

    const handleNotificationPress = async (notification) => {
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
        if (!actor) return "User";
        return actor.fullName || `${actor.firstName || ''} ${actor.surname || ''}`.trim() || "User";
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
                <SpinnerLoading />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
                <Text className="text-2xl font-bold" style={{ color: colors.primary }}>Notifications</Text>
            </View>
            <ScrollView 
                className="px-4 pb-6"
                style={{ backgroundColor: colors.background }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
            >
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <TouchableOpacity
                            key={notif._id}
                            activeOpacity={0.85}
                            onPress={() => handleNotificationPress(notif)}
                            className="flex-row items-start gap-3 p-4 rounded-2xl mb-4 shadow-lg"
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                                shadowColor: colors.primary,
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                shadowOffset: { width: 0, height: 4 },
                                elevation: 4,
                            }}
                        >
                            <View className="relative">
                                <Image
                                    source={{ uri: getFullUrl(notif.actor?.avatar) || "https://i.pravatar.cc/300?img=1" }}
                                    className="w-14 h-14 rounded-full"
                                    style={{ borderWidth: 2, borderColor: colors.primary + '30' }}
                                />
                                <View className="absolute bottom-0 right-0 rounded-full p-1" style={{ backgroundColor: colors.card }}>
                                    <Ionicons name="notifications" size={16} color={colors.primary} />
                                </View>
                                {(!notif.isRead && !notif.read) && (
                                    <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-base" style={{ color: colors.text }}>
                                    <Text className="font-bold">{getActorName(notif.actor)} </Text>
                                    <Text style={{ color: colors.textSecondary }}>{notif.content || notif.message}</Text>
                                </Text>
                                <Text className="text-xs mt-2" style={{ color: colors.textTertiary }}>
                                    {formatTime(notif.createdAt)}
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} className="self-center" />
                        </TouchableOpacity>
                    ))
                ) : (
                    <View className="items-center py-24">
                        <View className="rounded-full p-6 mb-6" style={{ backgroundColor: colors.primary + '20' }}>
                            <Ionicons name="notifications-outline" size={48} color={colors.primary} />
                        </View>
                        <Text className="text-lg font-bold mb-2" style={{ color: colors.text }}>All caught up!</Text>
                        <Text className="text-center px-8" style={{ color: colors.textSecondary }}>
                            Come back later for new notifications!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
