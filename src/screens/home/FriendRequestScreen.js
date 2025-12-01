import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

export default function FriendRequestScreen({ invites = [] }) {
    if (!invites.length) {
        return (
            <Text className="text-center text-gray-400 mb-6">Không có lời mời nào</Text>
        );
    }
    return (
        <>
            <Text className="text-xl font-extrabold text-green-700 mb-5 mt-2 tracking-wide">
                Người lạ gửi lời mời kết bạn
            </Text>
            {invites.map((user) => (
                <View
                    key={user.id}
                    className="flex-row items-center gap-5 rounded-3xl bg-white shadow-2xl mb-7 px-5 py-5 border border-green-100"
                    style={{ elevation: 8 }}
                >
                    <Image
                        source={{ uri: user.avatar }}
                        className="h-20 w-20 rounded-full border-4 border-green-300 shadow"
                    />
                    <View className="flex-1">
                        <Text className="text-lg font-extrabold text-green-900 mb-2">
                            {user.firstName} {user.surname}
                        </Text>
                        <View className="flex-row gap-4 mt-2">
                            <TouchableOpacity
                                className="flex-1 rounded-full bg-green-500 py-2 items-center shadow"
                                style={{ elevation: 3 }}
                            >
                                <Text className="text-white font-bold tracking-wide">Chấp nhận</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 rounded-full bg-red-100 py-2 items-center border border-red-300"
                                style={{ elevation: 1 }}
                            >
                                <Text className="text-red-600 font-bold">Từ chối</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ))}
        </>
    );
}