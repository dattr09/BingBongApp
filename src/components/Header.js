import React, { useState, useEffect, useCallback } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getNotifications } from "../services/notificationService";
import { getCart } from "../services/cartService";
import { useThemeSafe } from "../utils/themeHelper";
import cartEventEmitter from "../utils/cartEventEmitter";

export default function Header({ onPressNotification }) {
    const navigation = useNavigation();
    const { colors } = useThemeSafe();
    const [unreadCount, setUnreadCount] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    const fetchCounts = async () => {
        try {
            const notifResult = await getNotifications(1);
            if (notifResult.success) {
                const unread = (notifResult.data || []).filter(n => !n.isRead && !n.read).length;
                setUnreadCount(unread);
            }

            const cartResult = await getCart();
            if (cartResult.success && cartResult.data) {
                const items = cartResult.data.items || [];
                const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                setCartCount(totalQuantity);
            }
        } catch (error) {
            console.error("Fetch counts error:", error);
        }
    };

    useEffect(() => {
        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        const unsubscribeState = navigation.addListener("state", () => {
            fetchCounts();
        });

        const handleCartUpdate = () => {
            fetchCounts();
        };
        cartEventEmitter.on("cartUpdated", handleCartUpdate);
        
        return () => {
            clearInterval(interval);
            unsubscribeState();
            cartEventEmitter.off("cartUpdated", handleCartUpdate);
        };
    }, [navigation]);

    useFocusEffect(
        useCallback(() => {
            fetchCounts();
        }, [])
    );

    return (
        <View
            className="flex-row items-center justify-between px-6 py-3 rounded-b-2xl shadow-lg w-full"
            style={{ backgroundColor: colors.card }}
        >
            {/* Logo */}
            <TouchableOpacity onPress={() => navigation.navigate("Home")}>
                <Image
                    source={require("../../assets/logo_bingbong.png")}
                    style={{ width: 44, height: 44, resizeMode: "contain" }}
                />
            </TouchableOpacity>

            {/* Icon group */}
            <View className="flex-row items-center">
                {/* Search */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center mx-1"
                    style={{ backgroundColor: colors.surface }}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("Search")}
                >
                    <Ionicons name="search" size={22} color={colors.primary} />
                </TouchableOpacity>
                
                {/* ListFriend */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center mx-1"
                    style={{ backgroundColor: colors.surface }}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("ListFriend")}
                >
                    <FontAwesome name="users" size={20} color={colors.primary} />
                </TouchableOpacity>

                {/* Cart with badge */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center mx-1 relative"
                    style={{ backgroundColor: `${colors.warning}15` }}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate("Cart")}
                >
                    <Ionicons name="cart-outline" size={22} color={colors.warning} />
                    {cartCount > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                            <Text className="text-white text-[10px] font-bold">
                                {cartCount > 99 ? "99+" : cartCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
                
                {/* Notifications with badge */}
                <TouchableOpacity
                    className="w-10 h-10 rounded-full items-center justify-center mx-1 relative"
                    style={{ backgroundColor: `${colors.error}15` }}
                    activeOpacity={0.7}
                    onPress={onPressNotification}
                >
                    <Ionicons name="notifications" size={22} color={colors.error} />
                    {unreadCount > 0 && (
                        <View className="absolute -top-1 -right-1 bg-red-500 min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                            <Text className="text-white text-[10px] font-bold">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Messenger */}
                <TouchableOpacity
                    onPress={() => navigation.navigate("Messenger")}
                    className="w-10 h-10 rounded-full items-center justify-center mx-1"
                    style={{ backgroundColor: colors.surface }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
