import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeSafe } from '../utils/themeHelper';

export default function MessengerNavbar() {
    const { colors } = useThemeSafe();
    const [activeTab, setActiveTab] = useState('chat');

    const tabs = [
        { key: 'chat', icon: 'chatbubble-ellipses', label: 'Chat' },
        { key: 'story', icon: 'albums', label: 'Story' },
        { key: 'menu', icon: 'grid', label: 'Menu' },
    ];

    return (
        <View className="flex-row shadow-2xl" style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        className="flex-1 items-center justify-center py-1"
                        style={{ backgroundColor: isActive ? colors.primary + '15' : 'transparent' }}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.85}
                    >
                        <View
                            className="rounded-full p-2 mb-1"
                            style={{
                                backgroundColor: isActive ? colors.primary + '20' : 'transparent',
                                shadowColor: isActive ? colors.primary : 'transparent',
                                shadowOpacity: isActive ? 0.18 : 0,
                                shadowRadius: isActive ? 8 : 0,
                                shadowOffset: { width: 0, height: 2 },
                                elevation: isActive ? 4 : 0,
                            }}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={22}
                                color={isActive ? colors.primary : colors.textTertiary}
                            />
                        </View>
                        <Text className="text-xs font-semibold" style={{ color: isActive ? colors.primary : colors.textTertiary }}>
                            {tab.label}
                        </Text>
                        {isActive && (
                            <View className="mt-1 h-1 w-8 rounded-full" style={{ backgroundColor: colors.primary }} />
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
