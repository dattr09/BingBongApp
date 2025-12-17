import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { signup } from "../../services/authService";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeSafe } from "../../utils/themeHelper";

export default function SignupScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [visible, setVisible] = useState(false);
  const showDatePicker = () => setVisible(true);
  const hideDatePicker = () => setVisible(false);
  const handleConfirm = (date) => {
    setDob(new Date(date).toLocaleDateString("vi-VN"));
    hideDatePicker();
  };

  const showToast = (message, type) => {
    setMsg(message);
    setMsgType(type);
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

  const handleSignup = async () => {
    try {
      if (!fullName) return showToast("Please enter Full Name!", "error");
      if (!dob) return showToast("Please select Date of Birth!", "error");
      if (!phone) return showToast("Please enter Phone Number!", "error");
      if (!email) return showToast("Please enter Email!", "error");
      if (!password) return showToast("Please enter Password!", "error");
      if (!gender) return showToast("Please select Gender!", "error");

      const currentYear = new Date().getFullYear();
      const birthYear = new Date(
        dob.split("/").reverse().join("-")
      ).getFullYear();

      if (currentYear - birthYear < 18) {
        return showToast("You must be 18 years old to sign up!", "error");
      }

      const genderValue =
        gender === "Male" ? "Male" : gender === "Female" ? "Female" : "Other";

      const userData = {
        email,
        fullName,
        phoneNumber: phone,
        dateOfBirth: new Date(dob.split("/").reverse().join("-")).toISOString(),
        password,
        gender: genderValue,
        education: { school: "" },
        work: { company: "" },
      };

      const success = await signup(userData);
      if (success) {
        showToast("Sign up successful!", "success");
        setTimeout(() => {
          navigation.replace("VerifyCode", {
            email: email,
            action: "verifyAccount",
          });
        }, 1500);
      } else {
        showToast("Sign up failed, please try again!", "error");
        console.error("Signup failed:", err);
      }
    } catch (err) {
      showToast("An error occurred, please try again!", "error");
      console.error("Signup error:", err);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* TOAST */}
      {msg !== "" && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            position: "absolute",
            top: 20,
            backgroundColor: msgType === "success" ? colors.success : colors.error,
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
        {/* LOGO */}
        <Image
          source={require("../../../assets/logo_bingbong.png")}
          className="w-32 h-32 mb-4"
        />

        {/* CARD FORM */}
        <View className="w-[90%] p-6 rounded-3xl shadow-xl" style={{ backgroundColor: colors.card }}>
          <Text className="text-2xl font-bold text-center mb-4" style={{ color: colors.primary }}>
            Create New Account
          </Text>

          {step === 1 ? (
            <>
              {/* Full Name */}
              <View
                className="w-full flex-row items-center px-3 py-1 rounded-xl mt-3"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor={colors.textTertiary}
                  value={fullName}
                  onChangeText={setFullName}
                  className="flex-1 text-base"
                  style={{ color: colors.text }}
                />
              </View>

              {/* DOB */}
              <TouchableOpacity
                className="w-full flex-row items-center px-3 py-3 rounded-xl mt-3"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
                onPress={showDatePicker}
              >
                <Text className="flex-1 text-base" style={{ color: dob ? colors.text : colors.textTertiary }}>
                  {dob || "Date of Birth"}
                </Text>
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={visible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
              />

              {/* Gender */}
              <Text className="mt-4 font-semibold text-center" style={{ color: colors.textSecondary }}>
                Gender
              </Text>
              <View className="flex-row justify-between mt-3">
                {[
                  { label: "Male", icon: "male-outline" },
                  { label: "Female", icon: "female-outline" },
                  { label: "Other", icon: "person-circle-outline" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    className="w-[30%] rounded-2xl py-4 items-center border-2"
                    style={{
                      backgroundColor: gender === item.label ? colors.primary : colors.surface,
                      borderColor: gender === item.label ? colors.primary : "transparent",
                    }}
                    onPress={() => setGender(item.label)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={30}
                      color={gender === item.label ? "#fff" : colors.textSecondary}
                    />
                    <Text
                      className="mt-1 font-medium"
                      style={{ color: gender === item.label ? "#fff" : colors.textSecondary }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* NEXT */}
              <TouchableOpacity
                className="w-full py-3 rounded-xl mt-6"
                style={{ backgroundColor: colors.primary }}
                onPress={() => setStep(2)}
              >
                <Text className="text-center text-white font-semibold">
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Phone */}
              <View
                className="w-full flex-row items-center px-3 py-1 rounded-xl mt-3"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <TextInput
                  placeholder="Phone Number"
                  placeholderTextColor={colors.textTertiary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="flex-1 text-base"
                  style={{ color: colors.text }}
                />
              </View>

              {/* Email */}
              <View
                className="w-full flex-row items-center px-3 py-1 rounded-xl mt-3"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={colors.textTertiary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  className="flex-1 text-base"
                  style={{ color: colors.text }}
                />
              </View>

              {/* Password */}
              <View
                className="w-full flex-row items-center px-3 py-1 rounded-xl mt-3"
                style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
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

              {/* SIGNUP */}
              <TouchableOpacity
                className="w-full py-3 rounded-xl mt-6"
                style={{ backgroundColor: colors.primary }}
                onPress={handleSignup}
              >
                <Text className="text-center text-white font-semibold">
                  Sign Up
                </Text>
              </TouchableOpacity>

              {/* BACK */}
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text className="text-center mt-4 font-semibold" style={{ color: colors.primary }}>
                  ← Back
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* LOGIN REDIRECT */}
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            Already have an account?{" "}
            <Text style={{ color: colors.primary, fontWeight: "bold" }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
