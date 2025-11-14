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

export default function SignupScreen() {
  const navigation = useNavigation();

  // STATES
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

  // TOAST MESSAGE
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState(""); // 'success' | 'error'
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // DATE PICKER
  const [visible, setVisible] = useState(false);
  const showDatePicker = () => setVisible(true);
  const hideDatePicker = () => setVisible(false);
  const handleConfirm = (date) => {
    setDob(new Date(date).toLocaleDateString("vi-VN"));
    hideDatePicker();
  };

  // SHOW TOAST
  const showToast = (message, type) => {
    setMsg(message);
    setMsgType(type);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleSignup = async () => {
    try {
      // Kiểm tra từng ô
      if (!fullName) return showToast("Vui lòng điền Họ và Tên!", "error");
      if (!dob) return showToast("Vui lòng chọn Ngày Sinh!", "error");
      if (!phone) return showToast("Vui lòng điền Số Điện Thoại!", "error");
      if (!email) return showToast("Vui lòng điền Email!", "error");
      if (!password) return showToast("Vui lòng điền Mật Khẩu!", "error");
      if (!gender) return showToast("Vui lòng chọn Giới Tính!", "error");

      const currentYear = new Date().getFullYear();
      const birthYear = new Date(dob.split("/").reverse().join("-")).getFullYear();

      if (currentYear - birthYear < 18) {
        return showToast("Bạn cần đủ 18 tuổi để đăng ký!", "error");
      }

      const genderValue =
        gender === "Nam" ? "Male" : gender === "Nữ" ? "Female" : "Other";

      const userData = {
        email,
        fullName,
        phoneNumber: phone,
        dateOfBirth: new Date(dob.split("/").reverse().join("-")).toISOString(), // ISO format
        password,
        gender: genderValue,
        education: { school: "" },
        work: { company: "" },
      };

      const success = await signup(userData);
      if (success) {
        showToast("Đăng ký thành công!", "success");
        setTimeout(() => {
          navigation.replace("VerifyCode", {
            email: email,
            action: "verifyAccount",
          });
        }, 1500);
      } else {
        showToast("Đăng ký thất bại, vui lòng thử lại!", "error");
      }
    } catch (err) {
      showToast("Đã xảy ra lỗi, vui lòng thử lại!", "error");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#EEF3FF]">
      {/* TOAST */}
      {msg !== "" && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            position: "absolute",
            top: 20,
            backgroundColor: msgType === "success" ? "#4ade80" : "#f87171",
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
        <View className="w-[90%] bg-white p-6 rounded-3xl shadow-xl">
          <Text className="text-2xl font-bold text-indigo-700 text-center mb-4">
            Tạo tài khoản mới
          </Text>

          {step === 1 ? (
            <>
              {/* Full Name */}
              <View className="w-full flex-row items-center border border-gray-300 px-3 py-1 rounded-xl bg-gray-50 mt-3">
                <TextInput
                  placeholder="Họ và tên"
                  value={fullName}
                  onChangeText={setFullName}
                  className="flex-1 text-base"
                />
              </View>

              {/* DOB */}
              <TouchableOpacity
                className="w-full flex-row items-center border border-gray-300 px-3 py-3 rounded-xl bg-gray-50 mt-3"
                onPress={showDatePicker}
              >
                <Text className={`flex-1 text-gray-700 text-base`}>
                  {dob || "Ngày sinh"}
                </Text>
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={visible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
              />

              {/* Gender */}
              <Text className="mt-4 font-semibold text-gray-600 text-center">
                Giới tính
              </Text>
              <View className="flex-row justify-between mt-3">
                {[
                  { label: "Nam", icon: "male-outline" },
                  { label: "Nữ", icon: "female-outline" },
                  { label: "Khác", icon: "person-circle-outline" },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    className={`w-[30%] rounded-2xl py-4 items-center border-2 ${gender === item.label
                      ? "bg-indigo-600 border-indigo-500"
                      : "bg-gray-100 border-transparent"
                      }`}
                    onPress={() => setGender(item.label)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={30}
                      color={gender === item.label ? "#fff" : "#555"}
                    />
                    <Text
                      className={`mt-1 font-medium ${gender === item.label ? "text-white" : "text-gray-600"
                        }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* NEXT */}
              <TouchableOpacity
                className="w-full bg-indigo-600 py-3 rounded-xl mt-6"
                onPress={() => setStep(2)}
              >
                <Text className="text-center text-white font-semibold">
                  Tiếp tục
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Phone */}
              <View className="w-full flex-row items-center border border-gray-300 px-3 py-1 rounded-xl bg-gray-50 mt-3">
                <TextInput
                  placeholder="Số điện thoại"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  className="flex-1 text-base"
                />
              </View>

              {/* Email */}
              <View className="w-full flex-row items-center border border-gray-300 px-3 py-1 rounded-xl bg-gray-50 mt-3">
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  className="flex-1 text-base"
                />
              </View>

              {/* Password */}
              <View className="w-full flex-row items-center border border-gray-300 px-3 py-1 rounded-xl bg-gray-50 mt-3">
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
                    name={secure ? "eye-off-outline" : "eye-outline"} // đổi icon khi toggle
                    size={20}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>

              {/* SIGNUP */}
              <TouchableOpacity
                className="w-full bg-indigo-600 py-3 rounded-xl mt-6"
                onPress={handleSignup}
              >
                <Text className="text-center text-white font-semibold">
                  Đăng ký
                </Text>
              </TouchableOpacity>

              {/* BACK */}
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text className="text-indigo-600 text-center mt-4 font-semibold">
                  ← Quay lại
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* LOGIN REDIRECT */}
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text className="text-gray-600 mt-4">
            Bạn đã có tài khoản?{" "}
            <Text className="text-indigo-700 font-bold">Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
