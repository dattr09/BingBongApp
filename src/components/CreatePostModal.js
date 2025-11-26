import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";

const privacyOptions = [
    { label: "Công khai", value: "public", icon: <Ionicons name="earth" size={18} color="#22c55e" /> },
    { label: "Bạn bè", value: "friends", icon: <Ionicons name="people" size={18} color="#3b82f6" /> },
    { label: "Chỉ mình tôi", value: "private", icon: <Ionicons name="lock-closed" size={18} color="#a3a3a3" /> },
];

export default function CreatePostModal({ visible, onClose, onPost, user }) {
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [privacy, setPrivacy] = useState("public");
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [localMessage, setLocalMessage] = useState(null);

    const pickImage = async () => {
        setImages((prev) => [
            ...prev,
            { uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80" }
        ]);
    };

    const handleRemoveImage = (idx) => {
        setImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const handlePost = () => {
        if (!content.trim() && images.length === 0) {
            setLocalMessage({ type: 'error', text: 'Bài viết phải có nội dung hoặc ảnh.' });
            setTimeout(() => setLocalMessage(null), 2000);
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onPost && onPost({ content, images, privacy });
            setContent("");
            setImages([]);
            setPrivacy("public");
            onClose();
            setLocalMessage({ type: 'success', text: 'Đăng bài thành công!' });
            setTimeout(() => setLocalMessage(null), 2000);
        }, 1200);
    };

    const selectedPrivacy = privacyOptions.find(opt => opt.value === privacy);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" statusBarTranslucent>
            <View className="flex-1 bg-[#f6f8fa]">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 pt-12 pb-4 bg-white rounded-b-3xl shadow-lg">
                    <Text className="text-xl font-bold text-blue-600">Tạo bài viết</Text>
                    <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
                        <Feather name="x" size={26} color="#333" />
                    </TouchableOpacity>
                </View>

                {/* User + Privacy */}
                <View className="flex-row items-center gap-3 px-6 py-4 bg-white mt-3 rounded-2xl mx-4 shadow-lg relative">
                    <Image
                        source={{ uri: user?.avatar || "https://i.pravatar.cc/100" }}
                        className="h-12 w-12 rounded-full border-2 border-blue-200"
                    />
                    <View className="flex-1">
                        <Text className="text-base font-semibold">{user?.name || "Bạn"}</Text>
                        <Pressable
                            className="flex-row items-center mt-1 px-2 py-1 rounded-lg bg-blue-50 w-36"
                            onPress={() => setShowPrivacy(!showPrivacy)}
                        >
                            {selectedPrivacy.icon}
                            <Text className="ml-2 text-xs text-blue-700 font-semibold">{selectedPrivacy.label}</Text>
                            <Ionicons name="chevron-down" size={14} color="#3b82f6" style={{ marginLeft: 2 }} />
                        </Pressable>
                    </View>
                </View>

                {showPrivacy && (
                    <View style={{
                        position: "absolute", top: 120, left: 60, zIndex: 9999,
                        backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb",
                        shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 10,
                        width: 170, paddingVertical: 8
                    }}>
                        {privacyOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingVertical: 10,
                                    paddingHorizontal: 16,
                                    backgroundColor: privacy === opt.value ? "#e0edff" : "#fff",
                                }}
                                onPress={() => { setPrivacy(opt.value); setShowPrivacy(false); }}
                            >
                                {opt.icon}
                                <Text style={{
                                    marginLeft: 10,
                                    fontSize: 12,
                                    color: privacy === opt.value ? "#1877F2" : "#333",
                                    fontWeight: privacy === opt.value ? "bold" : "normal"
                                }}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Content Input */}
                <View className="px-6 mt-5">
                    <TextInput
                        multiline
                        placeholder="Chia sẻ cảm nghĩ của bạn..."
                        value={content}
                        onChangeText={setContent}
                        className="text-lg text-black font-medium bg-blue-50 rounded-xl px-4 py-3"
                        style={{ minHeight: 100 }}
                    />
                </View>

                {/* Image previews */}
                {images.length > 0 && (
                    <ScrollView horizontal className="mt-5 px-6">
                        {images.map((img, idx) => (
                            <View key={idx} className="relative mr-3">
                                <Image source={{ uri: img.uri }} className="h-32 w-32 rounded-2xl border-2 border-blue-200" />
                                <TouchableOpacity
                                    onPress={() => handleRemoveImage(idx)}
                                    className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-black/60"
                                >
                                    <Feather name="x" size={18} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* Action buttons */}
                <View className="px-6 mt-10 mb-4">
                    <View className="flex-row items-center w-full">
                        <TouchableOpacity
                            className="flex-row items-center rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 px-5 py-3 flex-1 mr-3"
                            onPress={pickImage}
                        >
                            <Ionicons name="image" size={22} color="#1877F2" />
                            <Text className="ml-2 font-semibold text-blue-700">Thêm ảnh</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`rounded-xl px-10 py-3 shadow-lg ${loading ? "bg-gray-400" : "bg-blue-600"}`}
                            onPress={handlePost}
                            disabled={loading}
                            style={{ flex: 1 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="font-semibold text-white text-base text-center">Đăng</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
