import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StatusBar, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import FriendRequestScreen from "./FriendRequestScreen";

export default function FriendScreen() {
    // Người lạ gửi lời mời tới mình
    const [invites, setInvites] = useState([
        {
            id: "i1",
            firstName: "Phạm",
            surname: "Minh D",
            avatar: "https://i.pravatar.cc/200?img=4",
        },
        {
            id: "i2",
            firstName: "Lê",
            surname: "Ngọc E",
            avatar: "https://i.pravatar.cc/200?img=5",
        },
    ]);
    // Lời mời mình gửi cho người khác
    const [sentRequests, setSentRequests] = useState([
        {
            id: "s1",
            firstName: "Đặng",
            surname: "Thị F",
            avatar: "https://i.pravatar.cc/200?img=6",
        },
        {
            id: "s2",
            firstName: "Vũ",
            surname: "Quang G",
            avatar: "https://i.pravatar.cc/200?img=7",
        },
    ]);
    // Gợi ý bạn bè
    const [users, setUsers] = useState([
        {
            id: "u1",
            firstName: "Nguyễn",
            surname: "Văn A",
            avatar: "https://i.pravatar.cc/200?img=1",
        },
        {
            id: "u2",
            firstName: "Trần",
            surname: "Thị B",
            avatar: "https://i.pravatar.cc/200?img=2",
        },
        {
            id: "u3",
            firstName: "Hoàng",
            surname: "Tuấn C",
            avatar: "https://i.pravatar.cc/200?img=3",
        },
    ]);

    const onlineCount = 2; // dữ liệu fake
    const [tab, setTab] = useState("invite"); // invite | sent | suggest

    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-[#e0e7ff] to-[#f0fdfa]">
            <StatusBar barStyle="dark-content" backgroundColor="#e0e7ff" />
            {/* HEADER kiểu Messenger */}
            <View
                className="flex-row items-center px-5 pt-6 pb-5"
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
                <View className="flex-row items-center gap-4">
                    <Image
                        source={{ uri: "https://i.pravatar.cc/100" }}
                        className="h-12 w-12 rounded-full border-4 border-white shadow"
                    />
                    <Text className="text-white text-2xl font-extrabold tracking-wide">Bạn bè</Text>
                </View>
            </View>

            {/* TAB BAR dạng pill, icon lớn, spacing rộng */}
            <View className="flex-row justify-center gap-3 mb-7 mt-5 px-4">
                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0 overflow-hidden ${tab === "invite" ? "bg-green-50 border-green-400" : "bg-green-50 border-green-200"}`}
                    onPress={() => setTab("invite")}
                    style={{ maxWidth: 140 }}
                >
                    <View className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                    <Text
                        className={`text-sm font-bold flex-shrink ${tab === "invite" ? "text-green-700" : "text-green-500"}`}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{ maxWidth: 90, textAlign: "center" }}
                    >
                        {invites.length} đang hoạt động
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0 ${tab === "sent" ? "bg-sky-50 border-sky-400" : "bg-sky-50 border-sky-200"}`}
                    onPress={() => setTab("sent")}
                >
                    <Ionicons name="mail-outline" size={20} color={tab === "sent" ? "#0ea5e9" : "#38bdf8"} style={{ marginRight: 8 }} />
                    <Text
                        className={`text-base font-bold flex-shrink ${tab === "sent" ? "text-sky-700" : "text-sky-500"}`}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        Lời mời
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 flex-row items-center justify-center py-2 rounded-full shadow border-2 min-w-0 ${tab === "suggest" ? "bg-gray-50 border-gray-400" : "bg-gray-50 border-gray-200"}`}
                    onPress={() => setTab("suggest")}
                >
                    <Ionicons name="people-outline" size={20} color={tab === "suggest" ? "#64748b" : "#a3a3a3"} style={{ marginRight: 8 }} />
                    <Text
                        className={`text-base font-bold flex-shrink ${tab === "suggest" ? "text-gray-700" : "text-gray-500"}`}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        Gợi ý
                    </Text>
                </TouchableOpacity>
            </View>

            {/* DANH SÁCH THEO TAB */}
            <ScrollView className="px-4 pt-2 pb-2">
                {tab === "invite" && (
                    <FriendRequestScreen invites={invites} />
                )}
                {tab === "sent" && (
                    <>
                        <Text className="text-xl font-extrabold text-sky-700 mb-5 mt-2 tracking-wide">
                            Lời mời bạn đã gửi
                        </Text>
                        {sentRequests.length === 0 && (
                            <Text className="text-center text-gray-400 mb-6">Bạn chưa gửi lời mời nào</Text>
                        )}
                        {sentRequests.map((user) => (
                            <View
                                key={user.id}
                                className="flex-row items-center gap-5 rounded-3xl bg-white shadow-2xl mb-7 px-5 py-5 border border-sky-100"
                                style={{ elevation: 8 }}
                            >
                                <Image
                                    source={{ uri: user.avatar }}
                                    className="h-20 w-20 rounded-full border-4 border-sky-300 shadow"
                                />
                                <View className="flex-1">
                                    <Text className="text-lg font-extrabold text-sky-900 mb-2">
                                        {user.firstName} {user.surname}
                                    </Text>
                                    <View className="flex-row gap-4 mt-2">
                                        <TouchableOpacity
                                            className="flex-1 rounded-full bg-gray-100 py-2 items-center border border-gray-300"
                                            style={{ elevation: 1 }}
                                        >
                                            <Text className="text-gray-600 font-bold">Đã gửi</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="flex-1 rounded-full bg-red-100 py-2 items-center border border-red-300"
                                            style={{ elevation: 1 }}
                                        >
                                            <Text className="text-red-600 font-bold">Thu hồi</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
                {tab === "suggest" && (
                    <>
                        <Text className="text-xl font-extrabold text-sky-700 mb-5 mt-2 tracking-wide">
                            Gợi ý kết bạn
                        </Text>
                        {users.length === 0 && (
                            <Text className="text-center text-gray-400 mb-6">Không có gợi ý nào</Text>
                        )}
                        {users.map((user) => (
                            <View
                                key={user.id}
                                className="flex-row items-center gap-5 rounded-3xl bg-white shadow-2xl mb-7 px-5 py-5 border border-sky-100"
                                style={{ elevation: 8 }}
                            >
                                <Image
                                    source={{ uri: user.avatar }}
                                    className="h-20 w-20 rounded-full border-4 border-sky-300 shadow"
                                />
                                <View className="flex-1">
                                    <Text className="text-lg font-extrabold text-sky-900 mb-2">
                                        {user.firstName} {user.surname}
                                    </Text>
                                    <View className="flex-row gap-4 mt-2">
                                        <TouchableOpacity
                                            className="flex-1 rounded-full bg-sky-500 py-2 items-center shadow"
                                            style={{ elevation: 3 }}
                                        >
                                            <Text className="text-white font-bold tracking-wide">Kết bạn</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className="flex-1 rounded-full bg-red-100 py-2 items-center border border-red-300"
                                            style={{ elevation: 1 }}
                                        >
                                            <Text className="text-red-600 font-bold">Xóa</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
