import api from "../api/api";
import { API_URL } from "@env";

// Add user ringtone
export const addUserRingtone = async (audioUri, name) => {
  try {
    const formData = new FormData();
    const filename = audioUri.split("/").pop();
    const match = /\.(\w+)$/.exec(filename);
    const fileType = match ? `audio/${match[1]}` : `audio/mpeg`;

    formData.append("ringtone", {
      uri: audioUri,
      name: filename || "ringtone.mp3",
      type: fileType,
    });
    formData.append("name", name);

    const response = await api.post("/user/ringtones", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Upload ringtone thành công",
    };
  } catch (error) {
    console.error("Add Ringtone Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể upload ringtone",
    };
  }
};

// Delete user ringtone
export const deleteUserRingtone = async (ringtoneId) => {
  try {
    const response = await api.delete(`/user/ringtones/${ringtoneId}`);
    return {
      success: true,
      message: response.data?.message || "Xóa ringtone thành công",
    };
  } catch (error) {
    console.error("Delete Ringtone Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể xóa ringtone",
    };
  }
};

// Set active ringtone
export const setActiveRingtone = async (ringtoneId) => {
  try {
    const response = await api.put(`/user/ringtones/active/${ringtoneId}`);
    return {
      success: true,
      message: response.data?.message || "Đặt ringtone thành công",
    };
  } catch (error) {
    console.error("Set Active Ringtone Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể đặt ringtone",
    };
  }
};

// Rename user ringtone
export const renameUserRingtone = async (ringtoneId, newName) => {
  try {
    const response = await api.put(`/user/ringtones/rename/${ringtoneId}`, {
      name: newName,
    });
    return {
      success: true,
      message: response.data?.message || "Đổi tên ringtone thành công",
    };
  } catch (error) {
    console.error("Rename Ringtone Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể đổi tên ringtone",
    };
  }
};

// Get full URL for ringtone
export const getRingtoneUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

