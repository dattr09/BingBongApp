import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchUsers } from '../../services/userService';
import SpinnerLoading from '../../components/SpinnerLoading';
import { API_URL } from '@env';

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function SearchScreen() {
    const navigation = useNavigation();
    const [inputText, setInputText] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    useEffect(() => {
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (!inputText.trim()) {
            setUsers([]);
            return;
        }

        // Set new timeout for debounced search
        const timeout = setTimeout(async () => {
            setLoading(true);
            try {
                const result = await searchUsers(inputText);
                if (result.success) {
                    setUsers(result.data || []);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error("Search error:", error);
                setUsers([]);
            } finally {
                setLoading(false);
            }
        }, 500);

        setSearchTimeout(timeout);

        // Cleanup
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [inputText]);

    const handleUserPress = (user) => {
        navigation.navigate("Profile", { userId: user._id });
    };

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
                    loading ? (
                        <View className="flex-1">
                            <SpinnerLoading />
                        </View>
                    ) : users.length > 0 ? (
                        <ScrollView className="py-4">
                            {users.map((user) => (
                                <TouchableOpacity
                                    key={user._id}
                                    className="flex-row items-center gap-3 mx-4 mb-3 p-3 bg-white rounded-2xl shadow-md border border-sky-50"
                                    activeOpacity={0.85}
                                    onPress={() => handleUserPress(user)}
                                    style={{
                                        shadowColor: "#38bdf8",
                                        shadowOpacity: 0.08,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 2 },
                                        elevation: 3,
                                    }}
                                >
                                    <Image
                                        source={{ uri: getFullUrl(user.avatar) }}
                                        className="h-12 w-12 rounded-full border-2 border-sky-200"
                                    />
                                    <View className="flex-1">
                                        <Text className="text-base font-semibold text-sky-900">
                                            {user.fullName || `${user.firstName || ''} ${user.surname || ''}`.trim()}
                                        </Text>
                                        {user.email && (
                                            <Text className="text-xs text-gray-400">{user.email}</Text>
                                        )}
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
