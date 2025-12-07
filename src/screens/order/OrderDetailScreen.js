import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import { getOrderById } from "../../services/orderService";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return "https://i.pravatar.cc/300?img=1";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

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
    hour: "2-digit",
    minute: "2-digit",
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

export default function OrderDetailScreen() {
  const route = useRoute();
  const { orderId } = route.params || {};
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setLoading(true);
      try {
        const res = await getOrderById(orderId);
        if (res.success) {
          setOrder(res.data);
        }
      } catch (error) {
        console.error("Fetch order error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (!order) {
    return (
      <MainLayout>
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-gray-500 text-center">
            Không tìm thấy đơn hàng
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Order Header */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
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
          </View>

          {/* Order Items */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Order Items
            </Text>
            {order.items?.map((item, index) => {
              const variant = item.product?.variants?.find(
                (v) => v._id === item.variant
              );
              return (
                <View
                  key={index}
                  className={`flex-row gap-4 pb-4 ${
                    index < order.items.length - 1 && "border-b border-gray-200 mb-4"
                  }`}
                >
                  <View className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                    {variant?.image && (
                      <Image
                        source={{ uri: getFullUrl(variant.image) }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">
                      {variant?.name || item.product?.name}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {item.product?.name}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      Quantity: {item.quantity}
                    </Text>
                    <Text className="text-orange-500 font-medium mt-2">
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Order Summary */}
          <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Order Summary
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-800 font-medium">
                {formatPrice(order.subtotal || order.totalAmount)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Shipping Fee</Text>
              <Text className="text-green-600 font-medium">Free</Text>
            </View>
            <View className="border-t border-gray-200 pt-3 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-semibold text-gray-800">Total</Text>
                <Text className="text-lg font-semibold text-blue-600">
                  {formatPrice(order.totalAmount || order.total)}
                </Text>
              </View>
            </View>
          </View>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
              <Text className="text-lg font-semibold text-gray-800 mb-3">
                Shipping Address
              </Text>
              <View className="flex-row items-start">
                <Ionicons name="location-outline" size={20} color="#6b7280" />
                <Text className="text-gray-700 ml-2 flex-1">
                  {order.shippingAddress}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
}

