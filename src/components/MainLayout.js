import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import Header from "./Header";
import Navbar from "./Navbar";
import { useThemeSafe } from "../utils/themeHelper";

// Map screen names to navbar indices
// Thứ tự: Home (0), Friends (1), Group (2), Shop (3), Menu (4)
const screenToIndex = {
  "Home": 0,
  "Friends": 1,
  "GroupPage": 2,
  "ShopPage": 3,
  // Menu không có screen riêng, nó mở modal
};

// Thêm prop disableScroll (mặc định là false)
export default function MainLayout({ children, disableScroll = false }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  
  // Initialize active state based on current route
  const getInitialActive = () => {
    const currentScreen = route.name;
    return screenToIndex[currentScreen] ?? 0;
  };
  
  const [active, setActive] = useState(getInitialActive);

  // Update active tab based on current route whenever it changes
  useEffect(() => {
    const currentScreen = route.name;
    const index = screenToIndex[currentScreen];
    if (index !== undefined) {
      setActive(index);
    }
  }, [route.name]);

  // Also update on focus to handle navigation changes
  useFocusEffect(
    React.useCallback(() => {
      const currentScreen = route.name;
      const index = screenToIndex[currentScreen];
      if (index !== undefined) {
        setActive(index);
      }
    }, [route.name])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header cố định trên cùng */}
      <SafeAreaView edges={["top"]}>
        <Header
          onPressNotification={() => navigation.navigate("Notification")}
        />
      </SafeAreaView>

      {/* Content */}
      {disableScroll ? (
        // MODE: Dành cho màn hình có FlatList (như HomeScreen, MovieScreen)
        // Bỏ padding ngang để thẻ/card chiếm tối đa chiều ngang.
        <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 12 }}>
          {children}
        </View>
      ) : (
        // MODE: Mặc định (cho các màn hình tĩnh)
        // Bỏ padding ngang để nội dung full width, thêm bottom padding cho navbar.
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}
          style={{ paddingHorizontal: 0, paddingTop: 12, backgroundColor: colors.background }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}

      {/* Navbar cố định dưới cùng */}
      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: "transparent" }}
      >
        <Navbar active={active} setActive={setActive} />
      </SafeAreaView>
    </View>
  );
}
