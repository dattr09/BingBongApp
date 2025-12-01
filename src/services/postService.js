import api from "../api/api"; // Import instance axios của bạn

export const getAllPosts = async () => {
  try {
    const response = await api.get("/posts");
    return {
      success: true,
      message: "Lấy danh sách thành công",
      data: response.data.posts || [],
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch posts",
      data: [],
    };
  }
};
