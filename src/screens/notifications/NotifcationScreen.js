import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationScreen() {
    const notifications = [
        {
            id: '1',
            actor: { firstName: 'Alice', surname: 'Smith', avatar: 'https://i.pravatar.cc/100?img=2' },
            content: 'đã đăng một bài viết mới',
            createdAt: '2025-11-26T12:00:00Z',
        },
        {
            id: '2',
            actor: { firstName: 'Bob', surname: 'Johnson', avatar: 'https://i.pravatar.cc/100?img=3' },
            content: 'đã bình luận về bài viết của bạn',
            createdAt: '2025-11-25T10:30:00Z',
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4">
                <Text className="text-2xl font-bold text-sky-700">Thông báo</Text>
                <TouchableOpacity className="p-2 rounded-full bg-sky-100">
                    <Ionicons name="settings-outline" size={22} color="#0ea5e9" />
                </TouchableOpacity>
            </View>
            <ScrollView className="px-4 pb-6">
                {notifications.map((notif) => (
                    <TouchableOpacity
                        key={notif.id}
                        activeOpacity={0.85}
                        className="flex-row items-start gap-3 p-4 bg-white rounded-2xl mb-4 shadow-lg border border-sky-50"
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
                                source={{ uri: notif.actor.avatar }}
                                className="w-14 h-14 rounded-full border-2 border-sky-200"
                            />
                            <View className="absolute bottom-0 right-0 bg-white rounded-full p-1">
                                <Ionicons name="notifications" size={16} color="#0ea5e9" />
                            </View>
                        </View>
                        <View className="flex-1">
                            <Text className="text-base text-sky-900">
                                <Text className="font-bold">{notif.actor.firstName} {notif.actor.surname} </Text>
                                <Text className="text-gray-700">{notif.content}</Text>
                            </Text>
                            <Text className="text-xs text-gray-400 mt-2">
                                {new Date(notif.createdAt).toLocaleString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric'
                                })}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#a1a1aa" className="self-center" />
                    </TouchableOpacity>
                ))}
                {notifications.length === 0 && (
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
