import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getNotifications } from "../services/notificationService";
import { getCart } from "../services/cartService";
import { useMenu } from "../context/MenuContext";

// Fallback nếu không có context
const useMenuSafe = () => {
  try {
    return useMenu();
  } catch {
    return { setShowMoreMenu: () => {} };
  }
};

export default function Header({ onPressNotification }) {
    const navigation = useNavigation();
    const { setShowMoreMenu } = useMenuSafe();
    const [unreadCount, setUnreadCount] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    const fetchCounts = async () => {
        try {
            // Fetch unread notifications count
            const notifResult = await getNotifications(1);
            if (notifResult.success) {
                const unread = (notifResult.data || []).filter(n => !n.isRead && !n.read).length;
                setUnreadCount(unread);
            }

            // Fetch cart count
            const cartResult = await getCart();
            if (cartResult.success && cartResult.data) {
                const items = cartResult.data.items || [];
                setCartCount(items.length);
            }
        } catch (error) {
            console.error("Fetch counts error:", error);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchCounts();
        }, [])
    );

    useEffect(() => {
        fetchCounts();
        // Refresh counts every 30 seconds
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View className="flex-row items-center justify-between px-6 py-3 bg-white rounded-b-2xl shadow-lg w-full">
            {/* Logo */}
            <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                <Image
                    source={require("../../assets/logo_bingbong.png")}
                    style={{ width: 44, height: 44, resizeMode: "contain" }}
                />
            </TouchableOpacity>

            {/* Icon group */}
            <View className="flex-row items-center">
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mx-1"
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("Search")}
                >
                    <Ionicons name="search" size={22} color="#1877F2" />
                </TouchableOpacity>
                
                {/* Notifications with badge */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mx-1 relative"
                    activeOpacity={0.7}
                    onPress={onPressNotification}
                >
                    <Ionicons name="notifications" size={22} color="#FF4D4F" />
                    {unreadCount > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                            <Text className="text-white text-[10px] font-bold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Cart with badge */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mx-1 relative"
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("Cart")}
                >
                    <Ionicons name="cart-outline" size={22} color="#FF6B35" />
                    {cartCount > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                            <Text className="text-white text-[10px] font-bold">
                                {cartCount > 99 ? "99+" : cartCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mx-1"
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("ListFriend")}
                >
                    <FontAwesome name="users" size={20} color="#1890FF" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => navigation.navigate("Messenger")}
                    className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mx-1"
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#1890FF" />
                </TouchableOpacity>
                
                {/* Menu Button */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mx-1"
                    activeOpacity={0.7}
                    onPress={() => setShowMoreMenu(true)}
                >
                    <Ionicons name="menu" size={22} color="#9333EA" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
