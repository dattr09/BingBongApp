import axios from "axios";
import { API_URL } from "@env";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true,
});

export default api;
