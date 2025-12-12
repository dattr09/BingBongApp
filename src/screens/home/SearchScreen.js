import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { searchUsers } from '../../services/userService';
import SpinnerLoading from '../../components/SpinnerLoading';
import { useThemeSafe } from '../../utils/themeHelper';
import { getFullUrl } from '../../utils/getPic';

export default function SearchScreen() {
    const navigation = useNavigation();
    const { colors } = useThemeSafe();
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
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            {/* Header with gradient background */}
            <View 
                className="px-5 pt-4 pb-5"
                style={{
                    backgroundColor: colors.primary,
                    borderBottomLeftRadius: 28,
                    borderBottomRightRadius: 28,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 8,
                }}
            >
                <View className="flex-row items-center gap-3 mb-4">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="p-2 rounded-full bg-white/20"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-2xl font-extrabold tracking-wide flex-1">
                        Search
                    </Text>
                </View>

                {/* Search Input */}
                <View className="flex-row items-center rounded-2xl px-4 py-3 shadow-lg" style={{ backgroundColor: colors.card }}>
                    <Ionicons name="search" size={22} color={colors.textTertiary} />
                    <TextInput
                        className="flex-1 ml-3 text-base"
                        style={{ color: colors.text }}
                        placeholder="Search users..."
                        placeholderTextColor={colors.textTertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        autoFocus
                        returnKeyType="search"
                    />
                    {inputText.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setInputText('')}
                            className="p-1"
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search results */}
            <View className="flex-1">
                {inputText.length > 0 ? (
                    loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#0EA5E9" />
                            <Text className="mt-4 text-gray-500 text-base">Searching...</Text>
                        </View>
                    ) : users.length > 0 ? (
                        <ScrollView 
                            className="flex-1"
                            contentContainerStyle={{ padding: 16 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text className="text-sm font-semibold text-gray-500 mb-3 px-2">
                                {users.length} {users.length === 1 ? 'result' : 'results'} found
                            </Text>
                            {users.map((user) => (
                                <TouchableOpacity
                                    key={user._id}
                                    className="flex-row items-center gap-4 mb-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100"
                                    activeOpacity={0.85}
                                    onPress={() => handleUserPress(user)}
                                    style={{
                                        shadowColor: "#000",
                                        shadowOpacity: 0.05,
                                        shadowRadius: 8,
                                        shadowOffset: { width: 0, height: 2 },
                                        elevation: 2,
                                    }}
                                >
                                    <View className="relative">
                                        <Image
                                            source={{ uri: getFullUrl(user.avatar) || "https://i.pravatar.cc/300?img=1" }}
                                            className="h-14 w-14 rounded-full"
                                            style={{ borderWidth: 2.5, borderColor: '#E0F2FE' }}
                                        />
                                        <View 
                                            className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white"
                                            style={{ backgroundColor: '#10B981' }}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>
                                            {user.fullName || `${user.firstName || ''} ${user.surname || ''}`.trim() || 'User'}
                                        </Text>
                                        {user.email && (
                                            <Text className="text-xs text-gray-400" numberOfLines={1}>
                                                {user.email}
                                            </Text>
                                        )}
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <View className="flex-1 items-center justify-center px-6">
                            <View className="bg-gray-100 rounded-full p-6 mb-4">
                                <Ionicons name="search-outline" size={64} color="#9CA3AF" />
                            </View>
                            <Text className="text-lg font-semibold text-gray-700 mb-2">
                                No results found
                            </Text>
                            <Text className="text-sm text-gray-500 text-center">
                                Try searching with a different name or keyword
                            </Text>
                        </View>
                    )
                ) : (
                    <View className="flex-1 items-center justify-center px-6">
                        <View 
                            className="rounded-full p-6 mb-6"
                            style={{ backgroundColor: '#E0F2FE' }}
                        >
                            <Ionicons name="search" size={64} color="#0EA5E9" />
                        </View>
                        <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
                            Discover People
                        </Text>
                        <Text className="text-base text-gray-500 text-center mb-8">
                            Enter a name to search for users
                        </Text>
                        <View className="w-full px-8">
                            <View className="flex-row items-center justify-center gap-4 mb-4">
                                <View className="items-center">
                                    <View className="bg-blue-100 rounded-full p-3 mb-2">
                                        <Ionicons name="people" size={24} color="#3B82F6" />
                                    </View>
                                    <Text className="text-xs text-gray-600 text-center">Find Friends</Text>
                                </View>
                                <View className="items-center">
                                    <View className="bg-purple-100 rounded-full p-3 mb-2">
                                        <Ionicons name="person-add" size={24} color="#9333EA" />
                                    </View>
                                    <Text className="text-xs text-gray-600 text-center">Connect</Text>
                                </View>
                                <View className="items-center">
                                    <View className="bg-green-100 rounded-full p-3 mb-2">
                                        <Ionicons name="chatbubbles" size={24} color="#10B981" />
                                    </View>
                                    <Text className="text-xs text-gray-600 text-center">Message</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
