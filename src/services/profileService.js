import api from "../api/api";

/**
 * Lấy thông tin Profile (Của chính mình hoặc người khác)
 * @param {string} [userId] - (Optional) ID người dùng. Nếu không truyền sẽ lấy profile bản thân.
 */
export const getUserProfile = async (userId) => {
  try {
    const url = userId ? `/user/profile/${userId}` : "/user/profile";
    const response = await api.get(url);

    // Backend có thể trả { user: {...} } hoặc trả trực tiếp object user
    const userData = response.data?.user || response.data || null;

    return {
      success: true,
      message: response.data?.message || "Lấy thông tin thành công",
      data: userData,
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
    const userData = response.data?.user || response.data || null;

    return {
      success: true,
      message: response.data?.message || "Lấy thông tin thành công",
      data: userData,
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
