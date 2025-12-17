import api from "../api/api";

// Get all groups
export const getAllGroups = async () => {
  try {
    const response = await api.get("/group");
    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: Array.isArray(response.data.data) ? response.data.data : [],
      };
    }
    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    console.error("GetAllGroups Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "Failed to fetch groups",
      data: [],
    };
  }
};

// Get my groups
export const getMyGroups = async () => {
  try {
    const response = await api.get("/group/my-groups");
    
    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: Array.isArray(response.data.data) ? response.data.data : [],
      };
    }
    
    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    console.error("GetMyGroups Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "Failed to fetch my groups",
      data: [],
    };
  }
};

// Get joined groups
export const getJoinedGroups = async () => {
  try {
    const response = await api.get("/group/joined-groups");
    
    if (response.data.success && response.data.data) {
      return {
        success: true,
        data: Array.isArray(response.data.data) ? response.data.data : [],
      };
    }
    
    return {
      success: true,
      data: Array.isArray(response.data) ? response.data : [],
    };
  } catch (error) {
    console.error("GetJoinedGroups Error:", error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "Failed to fetch joined groups",
      data: [],
    };
  }
};

// Get group by slug
export const getGroupBySlug = async (slug) => {
  try {
    const response = await api.get(`/group/${slug}`);
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
    const response = await api.post(`/group/${groupId}/join`);
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
    const response = await api.post(`/group/${groupId}/leave`);
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

// Approve pending member
export const approveMember = async (groupId, userId) => {
  try {
    const response = await api.post(`/group/${groupId}/approve/${userId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Member approved successfully",
    };
  } catch (error) {
    console.error("ApproveMember Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "Failed to approve member",
    };
  }
};

// Reject pending member
export const rejectMember = async (groupId, userId) => {
  try {
    const response = await api.post(`/group/${groupId}/reject/${userId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Member rejected successfully",
    };
  } catch (error) {
    console.error("RejectMember Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "Failed to reject member",
    };
  }
};

// Remove member from group
export const removeMember = async (groupId, userId) => {
  try {
    const response = await api.post(`/group/${groupId}/remove/${userId}`);
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || "Member removed successfully",
    };
  } catch (error) {
    console.error("RemoveMember Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "Failed to remove member",
    };
  }
};

// Manage member role (add/remove admin or moderator)
export const manageRole = async (groupId, userId, { action, role }) => {
  try {
    const response = await api.post(`/group/${groupId}/manage-role/${userId}`, {
      action,
      role,
    });
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || `${role} ${action}ed successfully`,
    };
  } catch (error) {
    console.error("ManageRole Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || error.response?.data?.error || "Failed to manage role",
    };
  }
};

