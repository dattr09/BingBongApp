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

const OrderCard = ({ order, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">
            Order #{order.orderId || order._id?.slice(-8)}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: `${getStatusColor(order.orderStatus)}20` }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: getStatusColor(order.orderStatus) }}
          >
            {order.orderStatus}
          </Text>
        </View>
      </View>

      <View className="border-t border-gray-200 pt-3">
        <View className="flex-row justify-between">
          <Text className="text-gray-600">
            {order.items?.length || 0} items
          </Text>
          <Text className="text-lg font-semibold text-blue-600">
            {formatPrice(order.totalAmount || order.total)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function OrderScreen() {
  const navigation = useNavigation();
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
        setOrders(res.data || []);
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
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
    navigation.navigate("OrderDetail", { orderId: order._id || order.orderId });
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
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-2xl font-semibold text-gray-800 mb-1">
            Order History
          </Text>
          <Text className="text-gray-500">
            View and manage all your orders
          </Text>
        </View>

        {/* Status Filter */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Order Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {statuses.map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setActiveStatus(status)}
                className={`px-4 py-2 rounded-lg border ${
                  activeStatus === status
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    activeStatus === status ? "text-white" : "text-gray-600"
                  }`}
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
            <OrderCard order={item} onPress={() => handleOrderPress(item)} />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} />
          }
          ListEmptyComponent={
            <View className="items-center mt-10 p-5">
              <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-4 text-lg">
                Chưa có đơn hàng nào
              </Text>
            </View>
          }
        />
      </View>
    </MainLayout>
  );
}

