import api from "../api/api";

// Get user orders
export const getUserOrders = async () => {
  try {
    const response = await api.get("/order/user-orders");
    return {
      success: true,
      data: response.data.data || response.data || [],
    };
  } catch (error) {
    console.error("GetUserOrders Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
      data: [],
    };
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/order/detail/${orderId}`);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("GetOrderById Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch order",
    };
  }
};

// Create order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post("/order/create", orderData);
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("CreateOrder Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to create order",
    };
  }
};

// Cancel order
export const cancelOrder = async (orderId) => {
  try {
    const response = await api.post("/order/user-cancel", { orderId });
    return {
      success: true,
      data: response.data.data || response.data,
    };
  } catch (error) {
    console.error("CancelOrder Error:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to cancel order",
    };
  }
};

