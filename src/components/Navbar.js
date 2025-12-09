import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMenu } from "../context/MenuContext";
import { useThemeSafe } from "../utils/themeHelper";
import MoreMenuModal from "./MoreMenuModal";

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
  const { colors } = useThemeSafe();

  // Main navigation items (5 items chính)
  const mainNavItems = [
    { name: "Home", icon: "home-outline", screen: "Home" },
    { name: "Friends", icon: "person-add-outline", screen: "Friends" },
    { name: "Group", icon: "people-outline", screen: "GroupPage" },
    { name: "Shop", icon: "storefront-outline", screen: "ShopPage" },
    { name: "Menu", icon: "grid-outline", screen: null, isMenu: true },
  ];

  const handleNavPress = (item, index) => {
    // Update active state first
    setActive(index);
    
    // Nếu là Menu, mở MoreMenuModal
    if (item.isMenu) {
      setShowMoreMenu(true);
      return;
    }
    
    // Navigate to screen - use replace if already on that screen to prevent stack buildup
    const currentRoute = navigation.getState()?.routes[navigation.getState()?.index]?.name;
    if (currentRoute === item.screen) {
      // Already on this screen, do nothing
      return;
    }
    navigation.navigate(item.screen);
  };

  return (
    <>
      <View className="absolute bottom-0 left-0 right-0 w-full pb-4 px-0">
        <View
          className="flex-row items-center justify-between rounded-t-2xl px-1 py-2 shadow-lg w-full"
          style={{ backgroundColor: colors.card }}
        >
          {mainNavItems.map((item, index) => {
            // Menu is active if it's the selected index OR if MoreMenuModal is open and this is the Menu item
            const isActive = active === index || (item.isMenu && showMoreMenu);
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleNavPress(item, index)}
                className={`flex-1 flex-col items-center justify-center rounded-xl py-2 px-1`}
                style={isActive ? { backgroundColor: `${colors.primary}15` } : {}}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
                {isActive && (
                  <Text
                    className="mt-1 text-[10px] font-semibold"
                    style={{ color: colors.primary }}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* More Menu Modal */}
      <MoreMenuModal />
    </>
  );
}
