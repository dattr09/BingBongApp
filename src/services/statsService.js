import api from "../api/api";

export const getUserStats = async () => {
  try {
    const response = await api.get("/user/stats");
    return {
      success: true,
      data: response.data?.data || response.data || {},
    };
  } catch (error) {
    console.error("GetUserStats Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải thống kê",
      data: {},
    };
  }
};

