import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function BottomNavbar({ active, setActive }) {
    const navItems = [
        { name: "Home", icon: <Ionicons name="home-outline" size={24} /> },
        { name: "Search", icon: <Ionicons name="search-outline" size={24} /> },
        { name: "Add", icon: <MaterialCommunityIcons name="plus-box-outline" size={28} /> },
        { name: "Notifications", icon: <Ionicons name="notifications-outline" size={24} /> },
        { name: "Profile", icon: <Ionicons name="person-outline" size={24} /> },
    ];

    return (
        <View className="flex-row justify-around items-center bg-white shadow-lg py-3 rounded-t-2xl absolute bottom-0 w-full">
            {navItems.map((item, index) => {
                const isActive = active === index;
                return (
                    <TouchableOpacity
                        key={index}
                        onPress={() => setActive(index)}
                        className="flex-1 items-center"
                    >
                        <View
                            className={`p-2 rounded-full ${isActive ? "bg-indigo-100" : "bg-transparent"
                                }`}
                        >
                            <Text className={`${isActive ? "text-indigo-600" : "text-gray-500"}`}>
                                {item.icon}
                            </Text>
                        </View>
                        <Text
                            className={`text-xs mt-1 ${isActive ? "text-indigo-600 font-semibold" : "text-gray-400"
                                }`}
                        >
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
