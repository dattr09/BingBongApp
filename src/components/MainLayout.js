import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Header from "./Header";
import Navbar from "./Navbar";

// MainLayout nhận props.children để bọc nội dung các màn hình con
export default function MainLayout({ children }) {
    const [active, setActive] = useState(0);
    const navigation = useNavigation();

    return (
        <View style={{ flex: 1, backgroundColor: "#EEF3FF" }}>
            {/* Header cố định trên cùng */}
            <SafeAreaView edges={["top"]}>
                <Header onPressNotification={() => navigation.navigate("Notification")} />
            </SafeAreaView>

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 70 }}
                style={{ paddingHorizontal: 16, paddingTop: 16 }}
            >
                {children}
            </ScrollView>

            {/* Navbar cố định dưới cùng */}
            <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "transparent" }}>
                <Navbar active={active} setActive={setActive} />
            </SafeAreaView>
        </View>
    );
}
