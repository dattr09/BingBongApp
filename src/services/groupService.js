import api from "../api/api";

// Get all groups
export const getAllGroups = async () => {
  try {
    const response = await api.get("/groups");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error("GetAllGroups Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch groups",
      data: [],
    };
  }
};

// Get my groups
export const getMyGroups = async () => {
  try {
    const response = await api.get("/groups/my-groups");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error("GetMyGroups Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch my groups",
      data: [],
    };
  }
};

// Get joined groups
export const getJoinedGroups = async () => {
  try {
    const response = await api.get("/groups/joined-groups");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error("GetJoinedGroups Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch joined groups",
      data: [],
    };
  }
};

// Get group by slug
export const getGroupBySlug = async (slug) => {
  try {
    const response = await api.get(`/groups/${slug}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("GetGroupBySlug Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch group",
    };
  }
};

// Join group
export const joinGroup = async (groupId) => {
  try {
    const response = await api.post(`/groups/${groupId}/join`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("JoinGroup Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to join group",
    };
  }
};

// Leave group
export const leaveGroup = async (groupId) => {
  try {
    const response = await api.post(`/groups/${groupId}/leave`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("LeaveGroup Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to leave group",
    };
  }
};

