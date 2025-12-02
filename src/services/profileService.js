import api from "../api/api";

/**
 * Lấy thông tin Profile (Của chính mình hoặc người khác)
 * @param {string} userId - (Optional) ID người dùng. Nếu không truyền sẽ lấy profile bản thân.
 */
export const getUserProfile = async (userId) => {
  try {
    const url = userId ? `/user/profile/${userId}` : "/user/profile";
    const response = await api.get(url);

    return {
      success: true,
      message: response.data.message || "Lấy thông tin thành công",
      data: response.data, // Thường backend trả về { user: ... } hoặc data nằm trực tiếp
    };
  } catch (error) {
    console.error("Get Profile Error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Không thể lấy thông tin người dùng",
      data: null,
    };
  }
};

/**
 * Lấy thông tin Profile theo Slug
 * @param {string} slug - Slug của người dùng
 */
export const getUserProfileBySlug = async (slug) => {
  try {
    const response = await api.get(`/user/profile/slug/${slug}`);

    return {
      success: true,
      message: response.data.message || "Lấy thông tin thành công",
      data: response.data,
    };
  } catch (error) {
    console.error("Get Profile By Slug Error:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Không thể tìm thấy người dùng này",
      data: null,
    };
  }
};

/**
 * Tìm kiếm người dùng theo tên
 * @param {string} name - Tên cần tìm
 */
export const searchUsersByName = async (name) => {
  try {
    // Encode tên để tránh lỗi ký tự đặc biệt trên URL
    const url = `/user/search?name=${encodeURIComponent(name)}`;
    const response = await api.get(url);

    return {
      success: true,
      message: response.data.message || "Tìm kiếm thành công",
      data: response.data, // Thường là mảng users
    };
  } catch (error) {
    console.error("Search User Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Lỗi khi tìm kiếm người dùng",
      data: [],
    };
  }
};
