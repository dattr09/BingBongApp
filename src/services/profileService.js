import api from "../api/api";

/**
 * Lấy thông tin Profile (Của chính mình hoặc người khác)
 * @param {string} [userId] - (Optional) ID người dùng. Nếu không truyền sẽ lấy profile bản thân.
 */
export const getUserProfile = async (userId) => {
  try {
    const url = userId ? `/user/profile/${userId}` : "/user/profile";
    const response = await api.get(url);
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

// Upload avatar
export const uploadAvatar = async (imageUri, type = "User", id) => {
  try {
    const formData = new FormData();
    const filename = imageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("avatar", {
      uri: imageUri,
      name: filename || "avatar.jpg",
      type: fileType,
    });
    formData.append("type", type);
    formData.append("id", id);

    const response = await api.post("/user/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Cập nhật ảnh đại diện thành công",
    };
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể cập nhật ảnh đại diện",
    };
  }
};

// Upload cover photo
export const uploadCoverPhoto = async (imageUri, type = "User", id) => {
  try {
    const formData = new FormData();
    const filename = imageUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append("coverPhoto", {
      uri: imageUri,
      name: filename || "cover.jpg",
      type: fileType,
    });
    formData.append("type", type);
    formData.append("id", id);

    const response = await api.post("/user/cover-photo", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Cập nhật ảnh bìa thành công",
    };
  } catch (error) {
    console.error("Upload Cover Photo Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể cập nhật ảnh bìa",
    };
  }
};

// Update user info
export const updateUserInfo = async (userId, userData) => {
  try {
    const response = await api.post(`/user/update-info/${userId}`, userData);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Cập nhật thông tin thành công",
    };
  } catch (error) {
    console.error("Update User Info Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể cập nhật thông tin",
    };
  }
};