import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Navbar({ active, setActive }) {
    const navItems = [
        { name: "Home", icon: "home-outline" },
        { name: "User", icon: "person-outline" },
        { name: "Data", icon: "layers-outline" },
    ];

    return (
        <View className="absolute bottom-0 left-0 right-0 w-full pb-4 px-0">
            <View className="flex-row items-center justify-between bg-white rounded-t-2xl px-6 py-3 shadow-lg w-full">
                {navItems.map((item, index) => {
                    const isActive = active === index;
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => setActive(index)}
                            className={`flex-1 flex-row items-center justify-center rounded-xl py-2 mx-1 ${isActive ? "bg-blue-50" : ""
                                }`}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={item.icon}
                                size={22}
                                color={isActive ? "#1877F2" : "#A0A0A0"}
                            />
                            {isActive && (
                                <Text className="ml-2 text-blue-600 font-bold">
                                    {item.name}
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}
