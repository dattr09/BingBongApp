import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { loginUser } from "../../services/authService";
import { SafeAreaView } from "react-native-safe-area-context";
import { saveToken, getToken, clearToken } from "../../utils/storage";
export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [msg, setMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Show toast message
  const showToast = (message) => {
    setMsg(message);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email || !password) return showToast("Vui lòng nhập đủ thông tin!");
    try {
      const data = await loginUser(email, password);
      if (data.success) {
        showToast("Đăng nhập thành công!");
        await saveToken(data.token);
        setTimeout(() => navigation.replace("Home"), 800);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Đăng nhập thất bại!");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#EEF3FF]">
      {/* Toast */}
      {msg !== "" && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            position: "absolute",
            top: 20,
            backgroundColor: msg.includes("Đăng nhập thành công!") ? "#4ade80" : "#f87171",
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 10,
            zIndex: 10,
            alignSelf: "center",
          }}
        >
          <Text className="text-white font-medium">{msg}</Text>
        </Animated.View>
      )}

      <View className="flex-1 items-center justify-center pt-4">
        {/* Logo */}
        <Image
          source={require("../../../assets/logo_bingbong.png")}
          className="w-32 h-32 mb-4"
        />

        {/* Card Form */}
        <View className="w-[90%] bg-white p-6 rounded-3xl shadow-xl">
          <Text className="text-2xl font-bold text-indigo-700 text-center mb-6">
            Đăng nhập
          </Text>

          {/* Email */}
          <View className="w-full flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 mb-4">
            <Ionicons name="mail-outline" size={20} color="#555" />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              className="flex-1 ml-2 text-base"
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View className="w-full flex-row items-center border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 mb-4">
            <Ionicons name="lock-closed-outline" size={20} color="#555" />
            <TextInput
              placeholder="Mật khẩu"
              secureTextEntry={secure} // kiểm soát ẩn/hiện
              value={password}
              onChangeText={setPassword}
              className="flex-1 ml-2 text-base"
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons
                name={secure ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#555"
              />
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <Text className="text-right text-indigo-600 mb-6">
            Quên mật khẩu?
          </Text>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            className="w-full bg-indigo-600 py-3 rounded-xl mb-4"
          >
            <Text className="text-white font-semibold text-center">
              Đăng nhập
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="mx-2 text-gray-500">Hoặc</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Google Login */}
          <TouchableOpacity className="w-full flex-row items-center justify-center border border-gray-300 py-3 rounded-xl mb-3">
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
              }}
              className="w-6 h-6 mr-3"
            />
            <Text className="text-blue-700 font-semibold">
              Đăng nhập bằng Google
            </Text>
          </TouchableOpacity>

          {/* GitHub Login */}
          <TouchableOpacity className="w-full flex-row items-center justify-center bg-[#161b22] py-3 rounded-xl">
            <FontAwesome name="github" size={22} color="white" />
            <Text className="text-white font-semibold ml-3">
              Đăng nhập bằng GitHub
            </Text>
          </TouchableOpacity>

          {/* Register redirect */}
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text className="text-center mt-4 text-gray-600">
              Chưa có tài khoản?{" "}
              <Text className="text-indigo-700 font-bold">Đăng ký</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
