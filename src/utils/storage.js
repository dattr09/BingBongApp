import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error("Save token error:", err);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error("Get token error:", err);
    return null;
  }
};

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error("Clear token error:", err);
  }
};

export const saveUser = async (user) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error("Save user error:", err);
  }
};

export const getUser = async () => {
  try {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (err) {
    console.error("Get user error:", err);
    return null;
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error("Clear user error:", err);
  }
};

export const clearAllAuth = async () => {
  await clearToken();
  await clearUser();
};
