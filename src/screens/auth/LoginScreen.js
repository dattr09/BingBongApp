import React, { useState } from "react";
// import { View, TextInput, Button, Text } from "react-native";
import { loginUser } from "../../services/authService";
import { signup } from "../../services/authService";
import { API_URL } from "@env";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigation = useNavigation();
  const [secure, setSecure] = useState(true);
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    try {
      const data = await loginUser(email, password);
      //console.log("Login successful:", data);
      if (data.success) {
        setMsg("✅ Đăng nhập thành công!");
        setTimeout(() => navigation.replace("Home"), 800);
      }
    } catch (err) {
      console.error(err.response?.data.message || err.message);
      setMessage(err.response?.data.message);
    }
  };

  const handleRegister = () => {
    navigation.navigate("Signup");
  };
  return (
    <View className="flex-1 justify-center items-center">
      {/* Background Gradient Fake */}
      <View className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500" />

      {/* Card */}
      <View className="bg-white w-11/12 rounded-3xl p-6 shadow-xl">
        <Text className="text-center text-2xl font-bold text-indigo-700">
          Đăng nhập
        </Text>

        {/* Email */}
        <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-6 bg-gray-50">
          <Ionicons name="mail-outline" size={20} color="#555" />
          <TextInput
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
            className="flex-1 ml-2"
          />
        </View>

        {/* Password */}
        <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50">
          <Ionicons name="lock-closed-outline" size={20} color="#555" />
          <TextInput
            placeholder="Nhập mật khẩu"
            secureTextEntry={secure}
            value={password}
            onChangeText={setPassword}
            className="flex-1 ml-2"
          />
          <TouchableOpacity onPress={() => setSecure(!secure)}>
            <Ionicons
              name={secure ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#555"
            />
          </TouchableOpacity>
        </View>

        {/* Forgot */}
        <Text className="text-right text-indigo-600 mt-1">Quên mật khẩu?</Text>

        {/* Login Button */}
        <TouchableOpacity
          onPress={handleLogin}
          className="bg-indigo-600 py-3 rounded-xl mt-5"
        >
          <Text className="text-white text-center font-semibold">
            Đăng nhập
          </Text>
        </TouchableOpacity>

        {/* Message */}
        {msg ? (
          <Text
            className={`text-center font-medium mt-2 ${
              msg.includes("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg}
          </Text>
        ) : null}

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

        {/* Register
        <Text className="text-center mt-4 text-gray-600">
          Chưa có tài khoản?{" "}
          <Text className="text-indigo-600 font-semibold">Đăng ký</Text>
        </Text> */}

        <TouchableOpacity onPress={handleRegister}>
          <Text className="text-center mt-4 text-gray-600">
            Chưa có tài khoản?{" "}
            <Text className="text-indigo-600 font-semibold">Đăng ký</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
