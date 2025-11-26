import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

export default function NotificationPopup({ content, onClose }) {
    return (
        <View className="absolute bottom-10 left-4 right-4 z-50">
            <View className="bg-white rounded-xl shadow-lg p-4 flex-row items-center">
                <Image
                    source={{ uri: content.author_img || 'https://i.pravatar.cc/100' }}
                    className="w-12 h-12 rounded-full mr-3 object-cover"
                />
                <View className="flex-1">
                    <Text className="font-semibold text-black">{content.author_name}</Text>
                    <Text className="text-gray-500">{content.title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} className="ml-2 p-1">
                    <Text className="text-blue-500 font-bold">Close</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
