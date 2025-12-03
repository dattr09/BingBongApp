import create from "zustand";
import { getToken, getUser, clearAllAuth } from "./tokenStorage";
import { login as loginAPI, logout as logoutAPI } from "./AuthService";

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  loading: true,

  initAuth: async () => {
    const token = await getToken();
    const user = await getUser();
    set({ token, user, isLoggedIn: !!token && !!user, loading: false });
  },

  login: async (email, password) => {
    const res = await loginAPI(email, password);
    if (res.success) {
      set({ user: res.user, token: await getToken(), isLoggedIn: true });
    }
    return res;
  },

  logout: async () => {
    await logoutAPI();
    set({ user: null, token: null, isLoggedIn: false });
  },
}));

export default useAuthStore;
