import api from "../api/api";

// Get notifications
export const getNotifications = async (page = 1) => {
  try {
    const response = await api.get(`/notifications?page=${page}`);
    return {
      success: true,
      data: response.data.data || response.data.notifications || [],
      pagination: response.data.pagination,
    };
  } catch (error) {
    console.error("GetNotifications Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch notifications",
      data: [],
    };
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await api.put("/notifications/mark-as-all-read");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("MarkAllAsRead Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to mark notifications as read",
    };
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("MarkAsRead Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to mark notification as read",
    };
  }
};

