import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; // Thêm dòng này

export default function MessengerHeader() {
    const userAvatar = 'https://i.pravatar.cc/100';
    const navigation = useNavigation(); // Thêm dòng này

    return (
        <View
            className="flex-row items-center justify-between px-5 pt-4 pb-4"
            style={{
                backgroundColor: 'linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%)',
                backgroundColor: Platform.OS === 'android' ? '#38bdf8' : undefined,
                borderBottomLeftRadius: 28,
                borderBottomRightRadius: 28,
                shadowColor: '#38bdf8',
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
                    className="relative p-2 rounded-full bg-white shadow-lg mr-1"
                    onPress={() => navigation.navigate('Notification')}
                >
                    <Ionicons name="notifications-outline" size={22} color="#0ea5e9" />
                    <View className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
                </TouchableOpacity>
                <TouchableOpacity className="p-2 rounded-full bg-white shadow-lg mx-1">
                    <Ionicons name="create-outline" size={22} color="#0ea5e9" />
                </TouchableOpacity>
                <TouchableOpacity className="p-2 rounded-full bg-white shadow-lg ml-1">
                    <Ionicons name="settings-outline" size={22} color="#0ea5e9" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
