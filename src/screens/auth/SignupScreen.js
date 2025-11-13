import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function SignupScreen() {
  const navigation = useNavigation();

  // FORM STATES
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  const [msg, setMsg] = useState("");

  // DATE PICKER
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const handleConfirm = (date) => {
    let d = new Date(date);
    setDob(d.toLocaleDateString("vi-VN"));
    hideDatePicker();
  };

  const handleSignup = () => {
    setMsg("✅ đăng kí thành công");
  };

  const goLogin = () => {
    navigation.replace("Login");
  };

  return (
    <View className="flex-1 justify-center items-center">
      <View className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500" />

      {/* CARD */}
      <View className="bg-white w-11/12 rounded-3xl p-6 shadow-xl">
        <Text className="text-center text-2xl font-bold text-indigo-700">
          Đăng ký tài khoản
        </Text>

        {/* FullName */}
        <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-6 bg-gray-50">
          <Ionicons name="person-outline" size={20} color="#555" />
          <TextInput
            placeholder="Họ và tên"
            value={fullName}
            onChangeText={setFullName}
            className="flex-1 ml-2"
          />
        </View>

        {/* DOB */}
        <TouchableOpacity
          onPress={showDatePicker}
          className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50"
        >
          <Ionicons name="calendar-outline" size={20} color="#555" />
          <TextInput
            placeholder="Ngày sinh"
            value={dob}
            editable={false}
            className="flex-1 ml-2 text-gray-700"
          />
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
        {/* Email */}
        <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50">
          <Ionicons name="mail-outline" size={20} color="#555" />
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            className="flex-1 ml-2"
          />
        </View>

        {/* Password */}
        <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50">
          <Ionicons name="lock-closed-outline" size={20} color="#555" />
          <TextInput
            placeholder="Mật khẩu"
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

        {/* Signup btn */}
        <TouchableOpacity
          onPress={handleSignup}
          className="bg-indigo-600 py-3 rounded-xl mt-6"
        >
          <Text className="text-white text-center font-semibold">Đăng ký</Text>
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

        {/* Google Btn */}
        <TouchableOpacity className="w-full flex-row items-center justify-center border border-gray-300 py-3 rounded-xl mb-3">
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/300/300221.png",
            }}
            className="w-6 h-6 mr-3"
          />
          <Text className="text-blue-700 font-semibold">
            Đăng ký bằng Google
          </Text>
        </TouchableOpacity>

        {/* Github */}
        <TouchableOpacity className="w-full flex-row items-center justify-center bg-[#161b22] py-3 rounded-xl">
          <FontAwesome name="github" size={22} color="white" />
          <Text className="text-white font-semibold ml-3">
            Đăng ký bằng GitHub
          </Text>
        </TouchableOpacity>

        {/* Already account */}
        <TouchableOpacity onPress={goLogin}>
          <Text className="text-center mt-4 text-gray-600">
            Đã có tài khoản?{" "}
            <Text className="text-indigo-700 font-bold">Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
