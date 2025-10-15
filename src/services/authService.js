import api from "../api/api";

// Đăng ký
export const signup = async (userData) => {
  const res = await api.post("/auth/signup", userData);
  return res.data;
};

// Đăng nhập (user)
export const loginUser = async (email, password) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

// Đăng nhập (admin)
export const loginAdmin = async (email, password) => {
  const res = await api.post("/auth/admin/login", { email, password });
  return res.data;
};

// Kiểm tra token
export const authCheck = async (token) => {
  const res = await api.get("/auth/authCheck", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Quên mật khẩu
export const forgotPassword = async (email) => {
  const res = await api.post("/auth/forgot-password", { email });
  return res.data;
};

// Xác minh mã
export const verifyCode = async (email, code) => {
  const res = await api.post("/auth/verify-code", { email, code });
  return res.data;
};

// Reset mật khẩu
export const resetPassword = async (email, newPassword) => {
  const res = await api.post("/auth/reset-password", { email, newPassword });
  return res.data;
};

// Đăng xuất
export const logout = async () => {
  const res = await api.post("/auth/logout");
  return res.data;
};
