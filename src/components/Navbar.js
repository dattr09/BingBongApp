import React from "react";
import { View, TouchableOpacity, Text, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMenu } from "../context/MenuContext";

// Fallback nếu không có context
const useMenuSafe = () => {
  try {
    return useMenu();
  } catch {
    return { showMoreMenu: false, setShowMoreMenu: () => {} };
  }
};

export default function Navbar({ active, setActive }) {
  const navigation = useNavigation();
  const { showMoreMenu, setShowMoreMenu } = useMenuSafe();

  // Main navigation items (5 items chính)
  const mainNavItems = [
    { name: "Home", icon: "home-outline", screen: "Home" },
    { name: "Shop", icon: "storefront-outline", screen: "ShopPage" },
    { name: "Nhóm", icon: "people-outline", screen: "GroupPage" },
    { name: "Bạn bè", icon: "person-add-outline", screen: "Friends" },
    { name: "Cá nhân", icon: "person-outline", screen: "Profile" },
  ];

  // More menu items
  const moreNavItems = [
    { name: "News", icon: "newspaper-outline", screen: "News" },
    { name: "Movie", icon: "film-outline", screen: "Movie" },
    { name: "Quiz", icon: "game-controller-outline", screen: "Quiz" },
    { name: "Badge", icon: "trophy-outline", screen: "Badge" },
  ];

  const handleNavPress = (screen, index) => {
    setActive(index);
    navigation.navigate(screen);
    setShowMoreMenu(false);
  };

  return (
    <>
      <View className="absolute bottom-0 left-0 right-0 w-full pb-4 px-0">
        <View className="flex-row items-center justify-between bg-white rounded-t-2xl px-1 py-2 shadow-lg w-full">
          {mainNavItems.map((item, index) => {
            const isActive = active === index;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleNavPress(item.screen, index)}
                className={`flex-1 flex-col items-center justify-center rounded-xl py-2 px-1 ${
                  isActive ? "bg-blue-50" : ""
                }`}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? "#1877F2" : "#A0A0A0"}
                />
                {isActive && (
                  <Text className="mt-1 text-[10px] text-blue-600 font-semibold" numberOfLines={1}>
                    {item.name}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* More Menu Modal */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Thêm</Text>
              <TouchableOpacity onPress={() => setShowMoreMenu(false)}>
                <Ionicons name="close" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-4">
              {moreNavItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-[45%] bg-gray-50 rounded-xl p-4 items-center"
                  onPress={() => {
                    const mainIndex = mainNavItems.length + index;
                    handleNavPress(item.screen, mainIndex);
                  }}
                >
                  <Ionicons name={item.icon} size={32} color="#1877F2" />
                  <Text className="mt-2 text-sm font-medium text-gray-900">
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
