import axios from "axios";
import { API_URL } from "@env";
import { getToken } from "../utils/storage";
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
// Gắn token tự động vào mọi request
api.interceptors.request.use(async (config) => {
  const token = await getToken(); // dùng hàm getToken thay cho tokenStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;