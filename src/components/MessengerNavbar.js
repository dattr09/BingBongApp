import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MessengerNavbar() {
    const [activeTab, setActiveTab] = useState('chat');

    const tabs = [
        { key: 'chat', icon: 'chatbubble-ellipses', label: 'Chat' },
        { key: 'story', icon: 'albums', label: 'Tin' },
        { key: 'menu', icon: 'grid', label: 'Menu' },
    ];

    return (
        <View className="flex-row bg-white rounded-t-3xl shadow-2xl border-t border-sky-100">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        className={`flex-1 items-center justify-center py-1 ${isActive ? 'bg-sky-50' : ''}`}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.85}
                    >
                        <View
                            className={`rounded-full p-2 mb-1 ${isActive ? 'bg-sky-100' : ''}`}
                            style={{
                                shadowColor: isActive ? '#38bdf8' : 'transparent',
                                shadowOpacity: isActive ? 0.18 : 0,
                                shadowRadius: isActive ? 8 : 0,
                                shadowOffset: { width: 0, height: 2 },
                                elevation: isActive ? 4 : 0,
                            }}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={22}
                                color={isActive ? '#0ea5e9' : '#a1a1aa'}
                            />
                        </View>
                        <Text className={`text-xs font-semibold ${isActive ? 'text-sky-700' : 'text-gray-400'}`}>
                            {tab.label}
                        </Text>
                        {isActive && (
                            <View className="mt-1 h-1 w-8 rounded-full bg-sky-400" />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
