import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMenu } from "../context/MenuContext";
import { useThemeSafe } from "../utils/themeHelper";
import MoreMenuModal from "./MoreMenuModal";

const useMenuSafe = () => {
  try {
    return useMenu();
  } catch {
    return { showMoreMenu: false, setShowMoreMenu: () => { } };
  }
};

const screenToNavIndex = {
  "Home": 0,
  "Friends": 1,
  "Shorts": 2,
  "MyShorts": 2,
  "CreateShort": 2,
  "GroupPage": 3,
  "DetailGroup": 3,
  "ShopPage": 4,
  "DetailShop": 4,
  "DetailProduct": 4,
};

export default function Navbar({ active, setActive }) {
  const navigation = useNavigation();
  const { showMoreMenu, setShowMoreMenu } = useMenuSafe();
  const { colors } = useThemeSafe();
  const mainNavItems = [
    { name: "Home", icon: "home-outline", screen: "Home" },
    { name: "Friends", icon: "person-add-outline", screen: "Friends" },
    { name: "Shorts", icon: "videocam-outline", screen: "Shorts" },
    { name: "Group", icon: "people-outline", screen: "GroupPage" },
    { name: "Shop", icon: "storefront-outline", screen: "ShopPage" },
    { name: "Menu", icon: "grid-outline", screen: null, isMenu: true },
  ];

  React.useEffect(() => {
    if (!showMoreMenu) {
      const state = navigation.getState();
      const currentRoute = state?.routes[state?.index]?.name;
      const navIndex = screenToNavIndex[currentRoute];
      if (navIndex !== undefined) {
        setActive(navIndex);
      }
    }
  }, [showMoreMenu, navigation, setActive]);

  const handleNavPress = (item, index) => {
    if (item.isMenu) {
      setActive(index);
      setShowMoreMenu(true);
      return;
    }

    setActive(index);

    const currentRoute = navigation.getState()?.routes[navigation.getState()?.index]?.name;
    if (currentRoute === item.screen) {
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
