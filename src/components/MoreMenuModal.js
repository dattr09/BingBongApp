import React, { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Alert, Image, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout } from "../services/authService";
import { useThemeSafe } from "../utils/themeHelper";
import { useMenu } from "../context/MenuContext";
import { getFullUrl } from "../utils/getPic";

export default function MoreMenuModal() {
  const navigation = useNavigation();
  const { showMoreMenu, setShowMoreMenu } = useMenu();
  const { isDark, colors, toggleTheme } = useThemeSafe();
  const [currentUser, setCurrentUser] = useState(null);
  const [slideAnim] = useState(new Animated.Value(300));

  useEffect(() => {
    if (showMoreMenu) {
      loadUserData();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [showMoreMenu]);

  const loadUserData = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              await AsyncStorage.removeItem("user");
              await AsyncStorage.removeItem("token");
              setShowMoreMenu(false);
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { name: "News", icon: "newspaper-outline", screen: "News", color: "#3B82F6" },
    { name: "Movie", icon: "film-outline", screen: "Movie", color: "#9333EA" },
    { name: "Quiz", icon: "game-controller-outline", screen: "Quiz", color: "#F59E0B" },
    { name: "Badge", icon: "trophy-outline", screen: "Badge", color: "#10B981" },
  ];

  const handleNavPress = (screen) => {
    setShowMoreMenu(false);
    navigation.navigate(screen);
  };

  return (
    <Modal
      visible={showMoreMenu}
      transparent
      animationType="none"
      onRequestClose={() => setShowMoreMenu(false)}
    >
      <TouchableOpacity
        className="flex-1"
        activeOpacity={1}
        onPress={() => setShowMoreMenu(false)}
        style={{ backgroundColor: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.5)" }}
      >
        <SafeAreaView className="flex-1 justify-end">
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={{
                transform: [{ translateY: slideAnim }],
                backgroundColor: colors.card,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 10,
                maxHeight: "85%",
              }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderBottomColor: colors.border }}>
                <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                  More
                </Text>
                <TouchableOpacity
                  onPress={() => setShowMoreMenu(false)}
                  className="p-2 rounded-full"
                  style={{ backgroundColor: colors.surface }}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* User Profile */}
                {currentUser && (
                  <View className="px-6 py-4 border-b" style={{ borderBottomColor: colors.border }}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowMoreMenu(false);
                        navigation.navigate("Profile");
                      }}
                      className="flex-row items-center gap-4"
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: getFullUrl(currentUser.avatar) || "https://i.pravatar.cc/300?img=1" }}
                        className="w-14 h-14 rounded-full"
                        style={{ borderWidth: 2, borderColor: colors.primary }}
                      />
                      <View className="flex-1">
                        <Text className="text-lg font-bold" style={{ color: colors.text }}>
                          {currentUser.fullName || currentUser.name || "User"}
                        </Text>
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          View Profile
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Menu Items */}
                <View className="px-6 py-4">
                  <Text className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
                    Quick Access
                  </Text>
                  <View className="flex-row flex-wrap gap-4">
                    {menuItems.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        className="w-[45%] rounded-2xl p-4 items-center"
                        style={{ backgroundColor: colors.surface }}
                        onPress={() => handleNavPress(item.screen)}
                        activeOpacity={0.7}
                      >
                        <View
                          className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
                          style={{ backgroundColor: `${item.color}15` }}
                        >
                          <Ionicons name={item.icon} size={28} color={item.color} />
                        </View>
                        <Text className="text-sm font-semibold" style={{ color: colors.text }}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Settings Section */}
                <View className="px-6 py-2 border-t" style={{ borderTopColor: colors.border }}>
                  <Text className="text-sm font-semibold mb-3 px-2" style={{ color: colors.textSecondary }}>
                    Settings
                  </Text>

                  {/* Theme Toggle */}
                  <TouchableOpacity
                    className="flex-row items-center justify-between px-4 py-4 rounded-xl mb-2"
                    style={{ backgroundColor: colors.surface }}
                    onPress={toggleTheme}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-3">
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${colors.primary}15` }}
                      >
                        <Ionicons
                          name={isDark ? "moon" : "sunny"}
                          size={20}
                          color={colors.primary}
                        />
                      </View>
                      <View>
                        <Text className="text-base font-semibold" style={{ color: colors.text }}>
                          {isDark ? "Dark Mode" : "Light Mode"}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          {isDark ? "Switch to light mode" : "Switch to dark mode"}
                        </Text>
                      </View>
                    </View>
                    <View
                      className="w-12 h-7 rounded-full items-center justify-center px-1"
                      style={{ backgroundColor: isDark ? colors.primary : colors.border }}
                    >
                      <View
                        className="w-5 h-5 rounded-full"
                        style={{
                          backgroundColor: "#FFFFFF",
                          marginLeft: isDark ? 10 : -10,
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View className="px-6 py-4">
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-3 py-4 rounded-xl"
                    style={{ backgroundColor: `${colors.error}15` }}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="log-out-outline" size={22} color={colors.error} />
                    <Text className="text-base font-semibold" style={{ color: colors.error }}>
                      Logout
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bottom Padding */}
                <View className="h-6" />
              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableOpacity>
    </Modal>
  );
}
