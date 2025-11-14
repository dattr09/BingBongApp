import React from "react";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
export default function HomeScreen() {
  const navigation = useNavigation();
  const handleLogout = () => {
    navigation.navigate("Login");
  };

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">Home Screen 🏠</Text>

      <Text className="text-lg text-gray-700">Welcome to the app!</Text>

      <Text className="text-md text-gray-500">Enjoy your stay!</Text>

      <Text className="text-sm text-gray-400">
        Feel free to explore the features.
      </Text>
      <TouchableOpacity onPress={handleLogout}>
        <Text className="text-center mt-4 text-gray-600">
          Chưa có tài khoản?{" "}
          <Text className="text-indigo-600 font-semibold">Đăng ký</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
