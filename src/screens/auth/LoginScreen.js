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
import { saveToken, saveUser } from "../../utils/storage";
import { useThemeSafe } from "../../utils/themeHelper";
import { onUserLogin } from "../../services/zegoService"; // Import hàm này
export default function LoginScreen() {
  const { colors } = useThemeSafe();
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [msg, setMsg] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
    if (!email || !password) return showToast("Please enter all information!");

    try {
      const res = await loginUser(email, password);
      if (res.success) {
        showToast("Login successful!");

        if (res.token) await saveToken(res.token);
        if (res.user) await saveUser(res.user);
        await onUserLogin(
          data.user._id,
          data.user.fullName || data.user.firstName
        );
        setTimeout(() => navigation.replace("Home"), 800);
      } else {
        showToast(res.message || "Login failed!");
      }
    } catch (err) {
      console.error("Login Error:", err);
      showToast(err.response?.data?.message || "Login failed!");
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      {/* Toast */}
      {msg !== "" && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            position: "absolute",
            top: 20,
            backgroundColor: msg.includes("Login successful!")
              ? colors.success
              : colors.error,
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
        <View
          className="w-[90%] p-6 rounded-3xl shadow-xl"
          style={{ backgroundColor: colors.card }}
        >
          <Text
            className="text-2xl font-bold text-center mb-6"
            style={{ color: colors.primary }}
          >
            Login
          </Text>

          {/* Email */}
          <View
            className="w-full flex-row items-center rounded-xl px-3 py-2 mb-4"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              className="flex-1 ml-2 text-base"
              style={{ color: colors.text }}
              keyboardType="email-address"
            />
          </View>

          {/* Password */}
          <View
            className="w-full flex-row items-center rounded-xl px-3 py-2 mb-4"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={secure}
              value={password}
              onChangeText={setPassword}
              className="flex-1 ml-2 text-base"
              style={{ color: colors.text }}
            />
            <TouchableOpacity onPress={() => setSecure(!secure)}>
              <Ionicons
                name={secure ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            className="mb-6"
          >
            <Text className="text-right" style={{ color: colors.primary }}>
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
            className="w-full py-3 rounded-xl mb-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-semibold text-center">Login</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center my-4">
            <View
              className="flex-1 h-px"
              style={{ backgroundColor: colors.border }}
            />
            <Text className="mx-2" style={{ color: colors.textSecondary }}>
              Or
            </Text>
            <View
              className="flex-1 h-px"
              style={{ backgroundColor: colors.border }}
            />
          </View>

          {/* Google Login */}
          <TouchableOpacity
            className="w-full flex-row items-center justify-center py-3 rounded-xl mb-3"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
              }}
              className="w-6 h-6 mr-3"
            />
            <Text className="font-semibold" style={{ color: colors.primary }}>
              Login with Google
            </Text>
          </TouchableOpacity>

          {/* GitHub Login */}
          <TouchableOpacity
            className="w-full flex-row items-center justify-center py-3 rounded-xl"
            style={{ backgroundColor: "#161b22" }}
          >
            <FontAwesome name="github" size={22} color="white" />
            <Text className="text-white font-semibold ml-3">
              Login with GitHub
            </Text>
          </TouchableOpacity>

          {/* Register redirect */}
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text
              className="text-center mt-4"
              style={{ color: colors.textSecondary }}
            >
              Don't have an account?{" "}
              <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                Sign up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
