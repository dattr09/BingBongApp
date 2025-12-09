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
import { useThemeSafe } from "../../utils/themeHelper";
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
  const { colors } = useThemeSafe();
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
          <Text className="text-center" style={{ color: colors.textSecondary }}>
            Order not found
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        <View className="p-4">
          {/* Order Header */}
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                  Order #{order.orderId || order._id?.slice(-8)}
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
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
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Order Items
            </Text>
            {order.items?.map((item, index) => {
              const variant = item.product?.variants?.find(
                (v) => v._id === item.variant
              );
              return (
                <View
                  key={index}
                  className="flex-row gap-4 pb-4"
                  style={index < order.items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 16 } : {}}
                >
                  <View className="w-20 h-20 rounded-lg overflow-hidden" style={{ backgroundColor: colors.surface }}>
                    {variant?.image && (
                      <Image
                        source={{ uri: getFullUrl(variant.image) }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold" style={{ color: colors.text }}>
                      {variant?.name || item.product?.name}
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      {item.product?.name}
                    </Text>
                    <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                      Quantity: {item.quantity}
                    </Text>
                    <Text className="font-medium mt-2" style={{ color: colors.warning }}>
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Order Summary */}
          <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
              Order Summary
            </Text>
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.textSecondary }}>Subtotal</Text>
              <Text className="font-medium" style={{ color: colors.text }}>
                {formatPrice(order.subtotal || order.totalAmount)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text style={{ color: colors.textSecondary }}>Shipping Fee</Text>
              <Text className="font-medium" style={{ color: colors.success }}>Free</Text>
            </View>
            <View className="pt-3 mt-2" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <View className="flex-row justify-between">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>Total</Text>
                <Text className="text-lg font-semibold" style={{ color: colors.primary }}>
                  {formatPrice(order.totalAmount || order.total)}
                </Text>
              </View>
            </View>
          </View>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <Text className="text-lg font-semibold mb-3" style={{ color: colors.text }}>
                Shipping Address
              </Text>
              <View className="flex-row items-start">
                <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                <Text className="ml-2 flex-1" style={{ color: colors.text }}>
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

