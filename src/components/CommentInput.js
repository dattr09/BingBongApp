import React, { useState } from 'react';
import { View, TextInput, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';

export default function CommentInput({ placeholder = 'Viết bình luận...', onSubmit }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
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
        <View className="flex-row items-end gap-2 px-2 py-2 bg-white/95 rounded-2xl shadow-md border border-sky-100">
            <Image
                source={{ uri: 'https://i.pravatar.cc/100' }}
                className="h-10 w-10 rounded-full border-2 border-sky-200"
            />
            <View className="flex-1 flex-row items-center bg-sky-50 rounded-full px-3 py-2 border border-sky-100">
                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder={placeholder}
                    placeholderTextColor="#38bdf8"
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    className="flex-1 text-base text-sky-900"
                    multiline
                />
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={loading}
                    className="ml-2 rounded-full bg-sky-500 p-2 shadow"
                    style={{ opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Send color="#fff" size={20} />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
