import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SearchScreen({ navigation }) {
    const [inputText, setInputText] = useState('');

    // Dummy users
    const dummyUsers = [
        { _id: '1', firstName: 'Alice', surname: 'Smith', avatar: 'https://i.pravatar.cc/100?img=2' },
        { _id: '2', firstName: 'Bob', surname: 'Johnson', avatar: 'https://i.pravatar.cc/100?img=3' },
        { _id: '3', firstName: 'Charlie', surname: 'Brown', avatar: 'https://i.pravatar.cc/100?img=4' },
    ];

    // Filter users by input text
    const filteredUsers = inputText
        ? dummyUsers.filter((u) =>
            `${u.firstName} ${u.surname}`.toLowerCase().includes(inputText.toLowerCase())
        )
        : [];

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
            {/* Header with back button and search input */}
            <View className="flex-row items-center gap-2 border-b border-sky-100 bg-white px-4 py-3 shadow-md rounded-b-2xl">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="p-2 rounded-full bg-sky-100"
                    activeOpacity={0.8}
                >
                    <Ionicons name="chevron-back" size={26} color="#0ea5e9" />
                </TouchableOpacity>
                <TextInput
                    className="flex-1 rounded-full bg-sky-50 px-5 py-2 text-base text-sky-900"
                    placeholder="Tìm kiếm người dùng..."
                    placeholderTextColor="#7dd3fc"
                    value={inputText}
                    onChangeText={setInputText}
                    autoFocus
                />
            </View>

            {/* Search results */}
            <View className="flex-1 bg-transparent">
                {inputText.length > 0 ? (
                    filteredUsers.length > 0 ? (
                        <ScrollView className="py-4">
                            {filteredUsers.map((user) => (
                                <TouchableOpacity
                                    key={user._id}
                                    className="flex-row items-center gap-3 mx-4 mb-3 p-3 bg-white rounded-2xl shadow-md border border-sky-50"
                                    activeOpacity={0.85}
                                    onPress={() => console.log('Go to profile', user._id)}
                                    style={{
                                        shadowColor: "#38bdf8",
                                        shadowOpacity: 0.08,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 2 },
                                        elevation: 3,
                                    }}
                                >
                                    <Image
                                        source={{ uri: user.avatar }}
                                        className="h-12 w-12 rounded-full border-2 border-sky-200"
                                    />
                                    <View className="flex-1">
                                        <Text className="text-base font-semibold text-sky-900">{`${user.firstName} ${user.surname}`}</Text>
                                        <Text className="text-xs text-gray-400">ID: {user._id}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#a1a1aa" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Ionicons name="search-outline" size={48} color="#38bdf8" />
                            <Text className="mt-2 text-base text-sky-700 font-semibold">Không tìm thấy kết quả</Text>
                        </View>
                    )
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="search" size={48} color="#38bdf8" />
                        <Text className="mt-2 text-base text-sky-700 font-semibold">Nhập tên để tìm kiếm người dùng</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
