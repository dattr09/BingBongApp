import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function Navbar({ active, setActive }) {
    const navigation = useNavigation();
    const navItems = [
        { name: "Home", icon: "home-outline", screen: "Home" },
        { name: "Bạn bè", icon: "people-outline", screen: "FriendScreen" },
        { name: "Quiz", icon: "help-circle-outline", screen: "Quiz" },
        { name: "Cửa hàng", icon: "cart-outline", screen: "Store" },
        { name: "Cá nhân", icon: "person-outline", screen: "Profile" },
    ];

    return (
        <View className="absolute bottom-0 left-0 right-0 w-full pb-4 px-0">
            <View className="flex-row items-center justify-between bg-white rounded-t-2xl px-2 py-2 shadow-lg w-full">
                {navItems.map((item, index) => {
                    const isActive = active === index;
                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                setActive(index);
                                navigation.navigate(item.screen);
                            }}
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
