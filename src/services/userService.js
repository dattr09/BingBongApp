import api from "../api/api";

// Search users by name
export const searchUsers = async (name) => {
  try {
    const response = await api.get(`/user/search?name=${name}`);
    return {
      success: true,
      data: response.data.data || response.data.users || [],
    };
  } catch (error) {
    console.error("SearchUsers Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to search users",
      data: [],
    };
  }
};

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await api.get("/user/get-all");
    return {
      success: true,
      data: response.data.data || response.data.users || [],
    };
  } catch (error) {
    console.error("GetAllUsers Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch users",
      data: [],
    };
  }
};

