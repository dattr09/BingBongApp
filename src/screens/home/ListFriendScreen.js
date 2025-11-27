import React, { useState } from "react";
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StatusBar, Dimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const friendsData = [
    {
        id: "1",
        name: "Nguyễn Minh Huy",
        avatar: "https://i.pravatar.cc/300?img=32",
        online: true,
    },
    {
        id: "2",
        name: "Trần Thị Thảo",
        avatar: "https://i.pravatar.cc/300?img=45",
        online: false,
    },
    {
        id: "3",
        name: "Lê Hoàng Tuấn",
        avatar: "https://i.pravatar.cc/300?img=20",
        online: true,
    },
    {
        id: "4",
        name: "Phạm Thanh Bình",
        avatar: "https://i.pravatar.cc/300?img=12",
        online: true,
    },
    {
        id: "5",
        name: "Hoàng Ngọc Anh",
        avatar: "https://i.pravatar.cc/300?img=5",
        online: false,
    },
];

const numColumns = 2;
const CARD_WIDTH = (Dimensions.get("window").width - 48) / numColumns;

export default function ListFriendScreen({ navigation }) {
    const [search, setSearch] = useState("");

    const filteredData = friendsData.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-cyan-100 to-sky-200">
            <StatusBar barStyle="dark-content" backgroundColor="#e0f2fe" />
            {/* Header kiểu Messenger */}
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
                        source={{ uri: "https://i.pravatar.cc/100" }}
                        className="h-12 w-12 rounded-full border-4 border-white shadow"
                    />
                    <Text className="text-white text-2xl font-extrabold tracking-wide">Danh sách bạn bè</Text>
                </View>

                {/* Icon bên phải */}
                <View className="flex-row items-center gap-2">
                    <TouchableOpacity className="p-2 rounded-full bg-white shadow-lg mx-1">
                        <Ionicons name="person-add-outline" size={22} color="#0ea5e9" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 rounded-full bg-white shadow-lg mx-1" onPress={() => navigation.navigate("Messenger")}>
                        <Ionicons name="chatbubble-ellipses-outline" size={22} color="#0ea5e9" />
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2 rounded-full bg-white shadow-lg mx-1">
                        <Ionicons name="settings-outline" size={22} color="#0ea5e9" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Thanh tìm kiếm nổi */}
            <View className="mx-7 mt-4 z-10 shadow-xl">
                <View className="flex-row items-center bg-white rounded-2xl px-5 py-3 border border-sky-100">
                    <Ionicons name="search-outline" size={22} color="#38bdf8" />
                    <TextInput
                        className="flex-1 ml-3 text-base text-sky-900"
                        placeholder="Tìm kiếm bạn bè..."
                        placeholderTextColor="#7dd3fc"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {/* Danh sách bạn bè dạng lưới card hiện đại */}
            <FlatList
                data={filteredData}
                keyExtractor={(item) => item.id}
                numColumns={numColumns}
                className="mt-8"
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
                columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 18 }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => navigation.navigate("Chat", { participant: { 
                            _id: item.id, 
                            firstName: item.name, 
                            avatar: item.avatar, 
                            online: item.online 
                        }})}
                        className="bg-white rounded-3xl shadow-xl px-3 py-5 items-center w-[90%] mx-auto"
                        style={{
                            width: CARD_WIDTH,
                            minHeight: 180,
                            elevation: 6,
                        }}
                        activeOpacity={0.88}
                    >
                        <View className="relative mb-3">
                            <Image
                                source={{ uri: item.avatar }}
                                className="w-20 h-20 rounded-full border-4 border-sky-300 shadow"
                            />
                            {item.online && (
                                <View className="absolute bottom-2 right-2 w-5 h-5 bg-white rounded-full items-center justify-center">
                                    <View className="w-3 h-3 rounded-full bg-green-500" />
                                </View>
                            )}
                        </View>
                        <Text className="text-lg font-bold text-sky-900 text-center">{item.name}</Text>
                        <Text className={`text-xs mt-1 ${item.online ? "text-green-500" : "text-gray-400"}`}>
                            {item.online ? "Đang hoạt động" : "Ngoại tuyến"}
                        </Text>
                        <TouchableOpacity
                            className="mt-4 px-4 py-2 rounded-full bg-sky-100"
                            onPress={() => navigation.navigate("Chat", { participant: { 
                                _id: item.id, 
                                firstName: item.name, 
                                avatar: item.avatar, 
                                online: item.online 
                            }})}
                        >
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0ea5e9" />
                                <Text className="ml-2 text-sky-700 font-semibold text-sm">Nhắn tin</Text>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <Ionicons name="people-outline" size={54} color="#38bdf8" />
                        <Text className="text-sky-400 text-lg font-semibold mt-3">Không tìm thấy bạn bè nào</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
