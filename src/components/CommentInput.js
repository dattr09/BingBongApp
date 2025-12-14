import React, { useState, useEffect } from 'react';
import { View, TextInput, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeSafe } from '../utils/themeHelper';
import { getFullUrl } from '../utils/getPic';

export default function CommentInput({ placeholder = 'Write a comment...', onSubmit, disabled = false, currentUser }) {
    const { colors } = useThemeSafe();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [userAvatar, setUserAvatar] = useState('https://i.pravatar.cc/100');

    useEffect(() => {
        const fetchUserAvatar = async () => {
            try {
                // Nếu có currentUser được truyền vào, sử dụng nó
                if (currentUser && currentUser.avatar) {
                    const avatarUrl = getFullUrl(currentUser.avatar) || 'https://i.pravatar.cc/100';
                    setUserAvatar(avatarUrl);
                    return;
                }

                // Nếu không, lấy từ AsyncStorage
                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const avatarUrl = getFullUrl(user?.avatar) || 'https://i.pravatar.cc/100';
                    setUserAvatar(avatarUrl);
                }
            } catch (error) {
                console.error('Error fetching user avatar:', error);
            }
        };
        fetchUserAvatar();
    }, [currentUser]);

    const handleSubmit = async () => {
        if (!content.trim() || disabled || loading) return;
        if (onSubmit) {
            setLoading(true);
            try {
                await onSubmit(content.trim());
                setContent('');
            } catch (e) {
                console.warn(e);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(true);
            setTimeout(() => {
                setContent('');
                setLoading(false);
            }, 800);
        }
    };

    return (
        <View 
            className="flex-row items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
        >
            {/* Avatar với border và online indicator */}
            <View className="relative">
                <Image
                    source={{ uri: userAvatar }}
                    className="h-11 w-11 rounded-full"
                    style={{ borderWidth: 2.5, borderColor: colors.primary + '30' }}
                />
                <View 
                    className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2"
                    style={{ backgroundColor: colors.success, borderColor: colors.card }}
                />
            </View>

            {/* Input container */}
            <View 
                className="flex-1 flex-row items-center rounded-2xl px-4 py-3"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
            >
                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    editable={!disabled && !loading}
                    className="flex-1 text-base"
                    style={{ 
                        minHeight: 20,
                        maxHeight: 100,
                        fontSize: 15,
                        lineHeight: 20,
                        color: colors.text
                    }}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading || disabled || !content.trim()}
                    className="ml-3 rounded-full p-2.5"
                    style={{ 
                        backgroundColor: content.trim() ? colors.primary : colors.textTertiary,
                        opacity: (loading || disabled || !content.trim()) ? 0.6 : 1,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2
                    }}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Ionicons name="send" size={18} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
