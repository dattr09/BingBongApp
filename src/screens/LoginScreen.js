import React, { useState } from "react";
import { View, TextInput, Button, Text } from "react-native";
import { loginUser } from "../services/authService";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const data = await loginUser(email, password);
      console.log("✅ Đăng nhập thành công:", data);
      setMessage("Đăng nhập thành công ✅");
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage("❌ Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 100 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Đăng nhập</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Mật khẩu"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Đăng nhập" onPress={handleLogin} />
      {message && (
        <Text style={{ marginTop: 10, color: "blue" }}>{message}</Text>
      )}
    </View>
  );
}
