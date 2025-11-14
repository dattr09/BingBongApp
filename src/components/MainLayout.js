import React from "react";
import { View, SafeAreaView, ScrollView } from "react-native";
import Header from "./Header"; // import Header của bạn

// MainLayout nhận props.children để bọc nội dung các màn hình con
export default function MainLayout({ children }) {
    return (
        <SafeAreaView className="flex-1 bg-[#EEF3FF]">
            {/* Header */}
            <Header />

            {/* Content */}
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                className="px-4 pt-4"
            >
                {children}
            </ScrollView>
        </SafeAreaView>
    );
}
