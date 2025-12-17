import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getUserOrders } from "../../services/orderService";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "#f59e0b";
    case "Processing":
      return "#3b82f6";
    case "Shipping":
      return "#8b5cf6";
    case "Completed":
      return "#10b981";
    case "Cancelled":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const OrderCard = ({ order, onPress, colors }) => {
  const totalItems = order.products?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  const totalAmount = order.total || 0;
  const orderStatus = order.orderStatus || "Pending";
  const shopName = order.shop?.name || "Shop";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="rounded-xl p-4 mb-4 shadow-sm mx-4"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
            Order #{order.orderId || order._id?.slice(-8)}
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {formatDate(order.createdAt)}
          </Text>
          {shopName && (
            <Text className="text-xs mt-1" style={{ color: colors.textTertiary }}>
              {shopName}
            </Text>
          )}
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: `${getStatusColor(orderStatus)}20` }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: getStatusColor(orderStatus) }}
          >
            {orderStatus}
          </Text>
        </View>
      </View>

      <View className="pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
        <View className="flex-row justify-between items-center">
          <Text style={{ color: colors.textSecondary }}>
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </Text>
          <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
            {formatPrice(totalAmount)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function OrderScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const statuses = ["All", "Pending", "Processing", "Shipping", "Completed", "Cancelled"];
  const fetchOrders = useCallback(async () => {
    if (!refreshing) setLoading(true);
    try {
      const res = await getUserOrders();
      if (res.success) {
        const ordersData = Array.isArray(res.data) ? res.data : [];
        setOrders(ordersData);
      } else {
        setOrders([]);
        console.error("Fetch orders failed:", res.message);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (activeStatus === "All") {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.orderStatus === activeStatus));
    }
  }, [orders, activeStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleOrderPress = (order) => {
    if (!order.orderId) {
      console.error("Order orderId not found. Order object:", order);
      if (order._id) {
        console.warn("Using _id as fallback, but this may not work with backend");
        navigation.navigate("OrderDetail", { orderId: order._id });
      } else {
        console.error("Cannot navigate: No orderId or _id found");
      }
      return;
    }
    navigation.navigate("OrderDetail", { orderId: order.orderId });
  };

  if (loading && !refreshing && orders.length === 0) {
    return (
      <MainLayout disableScroll={true}>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  return (
    <MainLayout disableScroll={true}>
      <View className="flex-1">
        {/* Header */}
        <View className="rounded-lg p-4 mb-4 shadow-sm" style={{ backgroundColor: colors.card }}>
          <Text className="text-2xl font-semibold mb-1" style={{ color: colors.text }}>
            Order History
          </Text>
          <Text style={{ color: colors.textSecondary }}>
            View and manage all your orders
          </Text>
        </View>

        {/* Status Filter */}
        <View className="rounded-lg p-4 mb-4 shadow-sm" style={{ backgroundColor: colors.card }}>
          <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
            Order Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setActiveStatus(status)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: activeStatus === status ? colors.primary : colors.card,
                  borderColor: activeStatus === status ? colors.primary : colors.border,
                }}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: activeStatus === status ? "white" : colors.textSecondary }}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id || item.orderId}
          renderItem={({ item }) => (
            <OrderCard order={item} onPress={() => handleOrderPress(item)} colors={colors} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6">
              <View className="rounded-full p-6 mb-4" style={{ backgroundColor: colors.surface }}>
                <Ionicons name="receipt-outline" size={64} color={colors.textTertiary} />
              </View>
              <Text className="text-xl font-semibold mb-2 text-center" style={{ color: colors.text }}>
                {activeStatus === "All" ? "No orders yet" : `No ${activeStatus} orders`}
              </Text>
              <Text className="text-center text-sm" style={{ color: colors.textSecondary }}>
                {activeStatus === "All"
                  ? "You don't have any orders yet. Start shopping to create your first order!"
                  : `You don't have any orders with status "${activeStatus}"`}
              </Text>
            </View>
          }
        />
      </View>
    </MainLayout>
  );
}

