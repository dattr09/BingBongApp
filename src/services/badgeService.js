import api from "../api/api";

export const getAllBadges = async () => {
  try {
    const response = await api.get("/badges");
    return {
      success: true,
      data: response.data?.data || response.data || [],
    };
  } catch (error) {
    console.error("GetAllBadges Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải danh hiệu",
      data: [],
    };
  }
};

export const getUserBadgeInventory = async () => {
  try {
    const response = await api.get("/badges/user-inventory");
    return {
      success: true,
      data: response.data?.data || response.data || [],
    };
  } catch (error) {
    console.error("GetUserBadgeInventory Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể tải danh hiệu của bạn",
      data: [],
    };
  }
};

export const claimBadge = async (badgeId) => {
  try {
    const response = await api.post("/badges/claim", { badgeId });
    return {
      success: true,
      message: response.data?.message || "Nhận danh hiệu thành công",
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error("ClaimBadge Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể nhận danh hiệu",
    };
  }
};

export const equipBadge = async (badgeId) => {
  try {
    const response = await api.post("/badges/equip", { badgeId });
    return {
      success: true,
      message: response.data?.message || "Đã trang bị danh hiệu",
    };
  } catch (error) {
    console.error("EquipBadge Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể trang bị danh hiệu",
    };
  }
};

export const unequipBadge = async (badgeId) => {
  try {
    const response = await api.post("/badges/unequip", { badgeId });
    return {
      success: true,
      message: response.data?.message || "Đã gỡ danh hiệu",
    };
  } catch (error) {
    console.error("UnequipBadge Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Không thể gỡ danh hiệu",
    };
  }
};

