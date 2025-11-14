import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet, // Import StyleSheet
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { signup } from "../../services/authService";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context"; // Import SafeAreaView

export default function SignupScreen() {
  const navigation = useNavigation();

  // FORM STATES
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState(""); // SỬA: Dùng null làm giá trị mặc định
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

  const handleSignup = async () => {
    try {
      let currentDate = new Date();
      let currentYear = currentDate.getFullYear();
      let birthDate = new Date(dob.split("/").reverse().join("-"));
      let birthYear = birthDate.getFullYear();

      if (currentYear - birthYear < 18) {
        setMsg("Bạn cần phải đủ 18 tuổi để đăng ký tài khoản!");
        return;
      }

      // SỬA: Thêm kiểm tra gender
      if (gender === null) {
        setMsg("Vui lòng chọn giới tính của bạn!");
        return;
      }

      // SỬA: Cập nhật logic gán gender
      let genderValue;
      if (gender === "Nam") {
        genderValue = "Male";
      } else if (gender === "Nữ") {
        genderValue = "Female";
      } else {
        genderValue = "Other"; // Chỉ "Khác" mới là "Other"
      }

      const userData = {
        email,
        fullName,
        phoneNumber: phone,
        dateOfBirth: dob,
        password,
        gender: genderValue,
        education: { school: "" },
        work: { company: "" },
      };
      setMsg(
        "Dăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản. ✅"
      );
      // Gọi API đăng ký
      const success = await signup(userData);
      if (success) {
        navigation.replace("VerifyCode", {
          email: email,
          action: "verifyAccount",
        });
      }
    } catch (err) {
      console.error(err.response?.data.message || err.message);
      setMsg(err.response?.data.message || "Đã xảy ra lỗi, vui lòng thử lại!");
    }
  };

  const goLogin = () => {
    navigation.replace("Login");
  };

  return (
    // SỬA: Bọc toàn bộ bằng SafeAreaView
    <SafeAreaView style={styles.flexOne}>
      <View className="flex-1 justify-center items-center">
        <View className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500" />

        {/* CARD */}
        <View className="bg-white w-11/12 rounded-3xl p-6 shadow-xl">
          <Text className="text-center text-2xl font-bold text-indigo-700">
            Đăng ký tài khoản
          </Text>

          {/* FullName */}
          <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-6 bg-gray-50 h-12">
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
            className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50 h-12"
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

          {/* Gender */}
          {/* SỬA: Bỏ h-12 và overflow-hidden. 
  Thêm py-0 (hoặc để trống) vì Picker đã có height.
*/}
          <View className="flex-row items-center border border-gray-300 rounded-xl px-3 mt-4 bg-gray-50">
            <Ionicons name="male-female-outline" size={20} color="#555" />
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={{
                flex: 1,
                marginLeft: 8,
                height: 50, // SỬA: Dùng height cố định (quan trọng cho Android)
                // Bỏ height: "100%"
              }}
            >
              {/* SỬA LOGIC: Dùng value={null} để khớp với state */}
              <Picker.Item label="Chọn giới tính" value={null} color="#888" />
              <Picker.Item label="Nam" value="Nam" />
              <Picker.Item label="Nữ" value="Nữ" />
              <Picker.Item label="Khác" value="Khác" />
            </Picker>
          </View>

          {/* Email */}
          <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50 h-12">
            <Ionicons name="mail-outline" size={20} color="#555" />
            <TextInput
              placeholder="Email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              className="flex-1 ml-2"
            />
          </View>
          {/* phone */}
          <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50 h-12">
            <Ionicons name="call-outline" size={20} color="#555" />
            <TextInput
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              className="flex-1 ml-2"
            />
          </View>

          {/* Password */}
          <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mt-4 bg-gray-50 h-12">
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
            <Text className="text-white text-center font-semibold">
              Đăng ký
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
    </SafeAreaView>
  );
}

// Thêm StyleSheet để style cho Picker và SafeAreaView
const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  picker: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "transparent", // Xóa gạch chân trên Android
    height: "100%", // Đảm bảo Picker chiếm đủ chiều cao
  },
});
