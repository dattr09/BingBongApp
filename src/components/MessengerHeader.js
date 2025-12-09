import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeSafe } from '../utils/themeHelper';
import { getNotifications } from '../services/notificationService';
import { API_URL } from '@env';

export default function MessengerHeader() {
    const navigation = useNavigation();
    const { colors } = useThemeSafe();
    const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/100');
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUserAvatar = React.useCallback(async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                if (user.avatar) {
                    const avatarUrl = user.avatar.startsWith('http') 
                        ? user.avatar 
                        : `${API_URL}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
                    setUserAvatar(avatarUrl);
                } else {
                    // Fallback to default if no avatar
                    setUserAvatar('https://i.pravatar.cc/100');
                }
            }
        } catch (error) {
            console.error('Error fetching user avatar:', error);
        }
    }, []);

    useEffect(() => {
        fetchUserAvatar();
    }, [fetchUserAvatar]);

    const fetchUnreadCount = React.useCallback(async () => {
        try {
            const result = await getNotifications(1);
            if (result.success) {
                const unread = (result.data || []).filter(n => !n.isRead && !n.read).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error("Fetch unread count error:", error);
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        // Refresh count every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    // Refresh avatar and unread count when screen is focused
    useFocusEffect(
        React.useCallback(() => {
            fetchUserAvatar();
            fetchUnreadCount();
        }, [fetchUserAvatar, fetchUnreadCount])
    );

    return (
        <View
            className="flex-row items-center justify-between px-5 pt-4 pb-4"
            style={{
                backgroundColor: colors.primary,
                borderBottomLeftRadius: 28,
                borderBottomRightRadius: 28,
                shadowColor: colors.primary,
                shadowOpacity: 0.18,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
            }}
        >
            {/* Avatar + Tiêu đề */}
            <View className="flex-row items-center gap-3">
                <Image
                    source={{ uri: userAvatar }}
                    className="h-12 w-12 rounded-full border-4 border-white shadow"
                />
                <Text className="text-white text-2xl font-extrabold tracking-wide">Messenger</Text>
            </View>

            {/* Icon bên phải */}
            <View className="flex-row items-center gap-2">
                <TouchableOpacity
                    className="relative p-2 rounded-full shadow-lg"
                    style={{ backgroundColor: colors.card }}
                    onPress={() => navigation.navigate('Notification')}
                >
                    <Ionicons name="notifications-outline" size={22} color={colors.primary} />
                    {unreadCount > 0 && (
                        <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 border-2" style={{ backgroundColor: colors.error, borderColor: colors.card }}>
                            <Text className="text-white text-[10px] font-bold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
