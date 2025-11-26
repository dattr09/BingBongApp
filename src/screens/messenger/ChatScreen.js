import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen({ navigation, route }) {
    const participant = route?.params?.participant || {
        firstName: "Người lạ",
        avatar: "https://i.pravatar.cc/100",
        online: false,
    };

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { id: '1', text: 'Chào bạn!', sender: 'other', timestamp: '09:30' },
        { id: '2', text: 'Xin chào! Bạn khỏe không?', sender: 'me', timestamp: '09:32' },
        { id: '3', text: 'Mình khỏe, cảm ơn 😊', sender: 'other', timestamp: '09:33' },
        { id: '4', text: 'Tuyệt vời!', sender: 'me', timestamp: '09:34' },
    ]);

    const flatListRef = useRef();

    const handleSend = () => {
        if (!message.trim()) return;
        setMessages([
            ...messages,
            { id: Math.random().toString(), text: message, sender: 'me', timestamp: '09:35' },
        ]);
        setMessage('');
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-sky-100 to-cyan-100">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={70}
            >
                {/* Header hiện đại */}
                <View className="flex-row items-center justify-between bg-white px-4 py-2 shadow-md rounded-b-2xl">
                    <TouchableOpacity
                        className="p-2 rounded-full bg-sky-100"
                        onPress={() => navigation && navigation.goBack && navigation.goBack()}
                    >
                        <Ionicons name="chevron-back" size={24} color="#0ea5e9" />
                    </TouchableOpacity>
                    <View className="flex-row items-center gap-3">
                        <Image
                            source={{ uri: participant.avatar }}
                            className="h-11 w-11 rounded-full border-2 border-sky-400"
                        />
                        <View>
                            <Text className="text-lg font-bold text-sky-900">{participant.firstName}</Text>
                            <Text className="text-xs" style={{ color: participant.online ? "#22c55e" : "#a1a1aa" }}>
                                {participant.online ? "Đang hoạt động" : "Ngoại tuyến"}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity className="p-2 rounded-full bg-sky-100">
                        <Ionicons name="call-outline" size={22} color="#0ea5e9" />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
                    renderItem={({ item }) => {
                        const isMe = item.sender === 'me';
                        return (
                            <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-2`}>
                                {/* Avatar bên trái cho người kia */}
                                {!isMe && (
                                    <Image
                                        source={{ uri: participant.avatar }}
                                        className="h-8 w-8 rounded-full mr-2"
                                    />
                                )}
                                {/* Bong bóng chat */}
                                <View
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                                        isMe
                                            ? 'bg-sky-500 rounded-br-md border-2 border-sky-400'
                                            : 'bg-white shadow-md'
                                    }`}
                                    style={
                                        isMe
                                            ? {
                                                  borderTopRightRadius: 8,
                                                  borderBottomRightRadius: 8,
                                                  borderBottomLeftRadius: 20,
                                                  borderTopLeftRadius: 20,
                                                  alignSelf: 'flex-end',
                                              }
                                            : {}
                                    }
                                >
                                    <Text
                                        className={`text-base ${
                                            isMe ? 'text-white font-semibold' : 'text-sky-900'
                                        }`}
                                        style={isMe ? { letterSpacing: 0.2 } : {}}
                                    >
                                        {item.text}
                                    </Text>
                                    <Text
                                        className={`mt-1 text-[10px] ${
                                            isMe ? 'text-white/80 font-light' : 'text-gray-400'
                                        } text-right`}
                                    >
                                        {item.timestamp}
                                    </Text>
                                </View>
                                {/* Avatar bên phải cho mình (nếu muốn) */}
                                {/* {isMe && (
                                    <Image
                                        source={{ uri: 'https://i.pravatar.cc/100?img=1' }}
                                        className="h-8 w-8 rounded-full ml-2"
                                    />
                                )} */}
                            </View>
                        );
                    }}
                />

                {/* Input */}
                <View className="flex-row items-center bg-white px-3 py-2 border-t border-sky-100">
                    <TextInput
                        className="flex-1 bg-sky-50 rounded-full px-4 py-2 text-sky-900"
                        placeholder="Nhập tin nhắn..."
                        placeholderTextColor="#7dd3fc"
                        value={message}
                        onChangeText={setMessage}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        className="ml-2 rounded-full bg-sky-500 p-3 shadow-md"
                    >
                        <Ionicons name="send" color="white" size={20} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
