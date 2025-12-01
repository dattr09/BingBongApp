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
        // MODE: Dành cho màn hình có FlatList (như HomeScreen)
        // Render View thường (flex: 1) để FlatList bên trong tự quản lý cuộn.
        // Giữ lại paddingHorizontal/Top để giao diện đồng bộ.
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          {children}
        </View>
      ) : (
        // MODE: Mặc định (cho các màn hình tĩnh)
        // Dùng ScrollView để nội dung dài có thể cuộn được.
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}
          style={{ paddingHorizontal: 16, paddingTop: 16 }}
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
