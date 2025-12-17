import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeSafe } from '../utils/themeHelper';

export default function MessengerNavbar() {
    const { colors } = useThemeSafe();
    const navigation = useNavigation();
    const route = useRoute();
    const getActiveTab = () => {
        const routeName = route.name;
        if (routeName === 'Stories') return 'story';
        if (routeName === 'AIChat') return 'menu';
        return 'chat';
    };

    const activeTab = getActiveTab();

    const tabs = [
        { key: 'chat', icon: 'chatbubble-ellipses', label: 'Chat', screen: 'Messenger' },
        { key: 'story', icon: 'albums', label: 'Shop & Group', screen: 'Stories' },
        { key: 'menu', icon: 'grid', label: 'ChatAI', screen: 'AIChat' },
    ];

    const handleTabPress = (tab) => {
        if (tab.screen && route.name !== tab.screen) {
            navigation.navigate(tab.screen);
        }
    };

    return (
        <View className="flex-row shadow-2xl" style={{ backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        className="flex-1 items-center justify-center py-1"
                        style={{ backgroundColor: isActive ? colors.primary + '15' : 'transparent' }}
                        onPress={() => handleTabPress(tab)}
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
