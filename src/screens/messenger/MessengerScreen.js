import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, Image, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import MessengerHeader from '../../components/MessengerHeader';
import MessengerNavbar from '../../components/MessengerNavbar';

export default function MessengerScreen() {
    const [query, setQuery] = useState('');
    const navigation = useNavigation();

    // Dữ liệu giả
    const user = {
        _id: 'me',
        avatar: 'https://i.pravatar.cc/100?img=1',
        firstName: 'Bạn',
    };

    const friends = [
        { _id: '1', firstName: 'Alice', avatar: 'https://i.pravatar.cc/100?img=2', online: true },
        { _id: '2', firstName: 'Bob', avatar: 'https://i.pravatar.cc/100?img=3', online: false },
        { _id: '3', firstName: 'Charlie', avatar: 'https://i.pravatar.cc/100?img=4', online: true },
        { _id: '4', firstName: 'David', avatar: 'https://i.pravatar.cc/100?img=5', online: false },
    ];

    const recentChats = [
        {
            participant: friends[0],
            lastMessage: { text: 'Hey! How are you?', isSentByMe: false, timestamp: '10:30' },
        },
        {
            participant: friends[1],
            lastMessage: { text: 'See you later!', isSentByMe: true, timestamp: '09:15' },
        },
        {
            participant: friends[2],
            lastMessage: { text: 'Let’s catch up tomorrow.', isSentByMe: false, timestamp: 'Hôm qua' },
        },
    ];

    const filteredChats = recentChats.filter((chat) =>
        chat.participant.firstName.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
            {/* Header đẹp */}
            <MessengerHeader />

            {/* Thanh tìm kiếm nổi */}
            <View className="mx-6 mt-4 z-10 shadow-lg">
                <View className="flex-row items-center bg-white rounded-full px-4 py-2 border border-sky-100">
                    {/* Bạn có thể dùng icon ở đây nếu muốn */}
                    <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Tìm kiếm bạn bè, tin nhắn..."
                        placeholderTextColor="#7dd3fc"
                        className="flex-1 text-base text-sky-900"
                    />
                </View>
            </View>

            {/* Danh sách bạn bè */}
            <View className="mt-6 px-6">
                <Text className="text-base font-semibold text-sky-700 mb-2">Bạn bè trực tuyến</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-5">
                        {[user, ...friends].map((friend) => (
                            <TouchableOpacity key={friend._id} className="items-center">
                                <View className="relative">
                                    <Image
                                        source={{ uri: friend.avatar }}
                                        className="h-16 w-16 rounded-full border-2 border-sky-400"
                                    />
                                    {friend.online && (
                                        <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-white items-center justify-center">
                                            <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                        </View>
                                    )}
                                </View>
                                <Text className="mt-2 text-xs text-sky-900">{friend.firstName}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Danh sách chat */}
            <View className="flex-1 mt-6 px-4 pb-4">
                <Text className="text-base font-semibold text-sky-700 mb-3">Đoạn chat gần đây</Text>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredChats.length === 0 ? (
                        <View className="items-center py-12">
                            <Text className="mt-2 text-base text-sky-700 font-semibold">Không có đoạn chat nào</Text>
                        </View>
                    ) : (
                        filteredChats.map((chat) => (
                            <TouchableOpacity
                                key={chat.participant._id}
                                className="flex-row items-center bg-white rounded-2xl p-4 mb-4 shadow-lg border border-sky-50"
                                activeOpacity={0.85}
                                onPress={() => navigation.navigate('Chat', { participant: chat.participant })}
                            >
                                <View className="relative mr-3">
                                    <Image
                                        source={{ uri: chat.participant.avatar }}
                                        className="h-14 w-14 rounded-full border-2 border-sky-200"
                                    />
                                    {chat.participant.online && (
                                        <View className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-white items-center justify-center">
                                            <View className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                        </View>
                                    )}
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-sky-900">
                                        {chat.participant.firstName}
                                    </Text>
                                    <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                                        {chat.lastMessage.isSentByMe ? 'Bạn: ' : ''}
                                        {chat.lastMessage.text}
                                    </Text>
                                </View>
                                <Text className="text-xs text-gray-400 ml-2">
                                    {chat.lastMessage.timestamp}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Navbar đẹp */}
            <MessengerNavbar />
        </SafeAreaView>
    );
}
