import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Header from "./Header";
import Navbar from "./Navbar";

// Thêm prop disableScroll (mặc định là false)
export default function MainLayout({ children, disableScroll = false }) {
  const [active, setActive] = useState(0);
  const navigation = useNavigation();

  return (
    <View style={{ flex: 1, backgroundColor: "#EEF3FF" }}>
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
          style={{ paddingHorizontal: 0, paddingTop: 12 }}
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
