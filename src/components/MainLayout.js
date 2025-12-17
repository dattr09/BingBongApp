import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import Header from "./Header";
import Navbar from "./Navbar";
import { useThemeSafe } from "../utils/themeHelper";

const screenToIndex = {
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

export default function MainLayout({ children, disableScroll = false }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  const getInitialActive = () => {
    const currentScreen = route.name;
    return screenToIndex[currentScreen] ?? 0;
  };
  const [active, setActive] = useState(getInitialActive);

  useEffect(() => {
    const currentScreen = route.name;
    const index = screenToIndex[currentScreen];
    if (index !== undefined && index !== active) {
      setActive(index);
    }
  }, [route.name, active]);

  useFocusEffect(
    React.useCallback(() => {
      const currentScreen = route.name;
      const index = screenToIndex[currentScreen];
      if (index !== undefined && index !== active) {
        setActive(index);
      }
    }, [route.name, active])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <SafeAreaView edges={["top"]}>
        <Header
          onPressNotification={() => navigation.navigate("Notification")}
        />
      </SafeAreaView>

      {/* Content */}
      {disableScroll ? (
        <View style={{ flex: 1, paddingHorizontal: 0, paddingTop: 12 }}>
          {children}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}
          style={{ paddingHorizontal: 0, paddingTop: 12, backgroundColor: colors.background }}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      )}

      {/* Navbar */}
      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: "transparent" }}
      >
        <Navbar active={active} setActive={setActive} />
      </SafeAreaView>
    </View>
  );
}
