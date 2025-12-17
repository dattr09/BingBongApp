import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getOrderById, cancelOrder, confirmOrderReceived, requestReturnRefund } from "../../services/orderService";
import { getChatIdByTypeId } from "../../services/chatService";
import { getFullUrl } from "../../utils/getPic";
import Toast from "react-native-toast-message";

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

const formatDateTimeWithTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN", {
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
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const { orderId } = route.params || {};
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        console.error("OrderDetailScreen: orderId is missing");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        console.log("Fetching order with orderId:", orderId);
        const res = await getOrderById(orderId);
        if (res.success) {
          setOrder(res.data);
        } else {
          console.error("Failed to fetch order:", res.message);
          Toast.show({ type: "error", text1: res.message || "Failed to load order" });
        }
      } catch (error) {
        console.error("Fetch order error:", error);
        Toast.show({ 
          type: "error", 
          text1: "Failed to load order",
          text2: error.response?.data?.message || error.message 
        });
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
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textTertiary} />
          <Text style={{ textAlign: "center", marginTop: 16, fontSize: 16, color: colors.textSecondary }}>
            Order not found
          </Text>
        </View>
      </MainLayout>
    );
  }

  const handleOrderReceived = () => {
    if (order.completedAt) {
      Toast.show({ type: "info", text1: "Order already completed" });
      return;
    }
    
    Alert.alert(
      "Confirm Order Received",
      "Have you received this order? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setProcessing(true);
            try {
              const result = await confirmOrderReceived(order.orderId || order._id);
              if (result.success) {
                const res = await getOrderById(orderId);
                if (res.success) {
                  setOrder(res.data);
                }
                Toast.show({ 
                  type: "success", 
                  text1: "Order confirmed as received",
                  text2: "Thank you for your purchase!"
                });
              } else {
                Toast.show({ type: "error", text1: result.message || "Failed to confirm order" });
              }
            } catch (error) {
              console.error("Confirm order error:", error);
              Toast.show({ type: "error", text1: "An error occurred" });
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleRequestReturn = () => {
    Alert.alert(
      "Request Return/Refund",
      "Do you want to request a return or refund for this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          onPress: async () => {
            setProcessing(true);
            try {
              const result = await requestReturnRefund(order.orderId || order._id);
              if (result.success) {
                Toast.show({ 
                  type: "success", 
                  text1: "Return request submitted",
                  text2: "The shop will review your request"
                });
              } else {
                Toast.show({ type: "error", text1: result.message || "Failed to submit request" });
              }
            } catch (error) {
              console.error("Request return error:", error);
              Toast.show({ type: "error", text1: "An error occurred" });
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleChatWithSupport = async () => {
    if (!order.shop?._id) {
      Toast.show({ type: "error", text1: "Shop information not available" });
      return;
    }
    try {
      setProcessing(true);
      const result = await getChatIdByTypeId({
        type: "shop",
        shopId: order.shop._id,
      });
      if (result.success) {
        navigation.navigate("Chat", {
          shop: order.shop,
          chatType: "shop",
        });
      } else {
        Toast.show({ type: "error", text1: result.message || "Failed to open chat" });
      }
    } catch (error) {
      console.error("Chat error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setProcessing(false);
    }
  };

  const getProgressPercentage = () => {
    if (order.completedAt) return 100;
    if (order.shippingAt) return 75;
    if (order.confirmedAt) return 50;
    return 25;
  };

  const fullName = order.shipping
    ? `${order.shipping.lastName || ""} ${order.shipping.firstName || ""}`.trim()
    : "";

  return (
    <MainLayout>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Order Header */}
          <View style={{ 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 16, 
            backgroundColor: colors.card, 
            borderWidth: 1, 
            borderColor: colors.border 
          }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.text, marginBottom: 8 }}>
              Order Details
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Order ID: <Text style={{ fontWeight: "600", color: colors.primary }}>
                {order.orderId || order._id?.slice(-8)}
              </Text>
            </Text>
          </View>

          <View style={{ flexDirection: "column", gap: 16 }}>
            {/* LEFT SIDE - ORDER SUMMARY */}
            <View style={{ 
              borderRadius: 12, 
              padding: 16, 
              backgroundColor: colors.card, 
              borderWidth: 1, 
              borderColor: colors.border 
            }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text, marginBottom: 16 }}>
                Your Order
              </Text>
              
              {/* Products List */}
              <View style={{ marginBottom: 16 }}>
                {(order.products || order.items || []).map((product, index) => {
                  const variant = product.product?.variants?.find(
                    (v) => v._id === product.variant
                  ) || product.variants?.find((v) => v._id === product.variant);
                  
                  return (
                    <View
                      key={product._id || index}
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        paddingVertical: 12,
                        borderBottomWidth: index < (order.products || order.items || []).length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                        marginBottom: index < (order.products || order.items || []).length - 1 ? 12 : 0,
                      }}
                    >
                      <Image
                        source={{ uri: getFullUrl(variant?.image) }}
                        style={{ width: 64, height: 64, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                          {product.product?.name || product.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>
                          {variant?.name}
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                          Qty: {product.quantity}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#f59e0b" }}>
                        {formatPrice(product.price || variant?.price)}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

              {/* Price Breakdown */}
              <View style={{ gap: 8, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Subtotal</Text>
                  <Text style={{ fontSize: 15, color: colors.text }}>
                    {formatPrice(order.subtotal || order.total || order.totalAmount)}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Shipping</Text>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.success }}>Free</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

              {/* Total */}
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>Total</Text>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.primary }}>
                  {formatPrice(order.total || order.totalAmount)}
                </Text>
              </View>
            </View>

            {/* RIGHT SIDE - ORDER TRACKING */}
            <View style={{ gap: 16 }}>
              <View style={{ 
                borderRadius: 12, 
                padding: 20, 
                backgroundColor: colors.card, 
                borderWidth: 1, 
                borderColor: colors.border 
              }}>
                <View style={{ gap: 16 }}>
                  {/* Progress Bar */}
                  <View style={{ position: "relative", height: 4, marginBottom: 40 }}>
                    <View style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      height: 4, 
                      backgroundColor: colors.border,
                      borderRadius: 2,
                    }} />
                    
                    {/* Progress Line */}
                    <View style={{ 
                      position: "absolute", 
                      top: 0, 
                      left: 0, 
                      height: 4, 
                      width: `${getProgressPercentage()}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 2,
                    }} />

                    {/* Step Icons */}
                    <View style={{ 
                      position: "absolute", 
                      top: -20, 
                      left: 0, 
                      right: 0, 
                      flexDirection: "row", 
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      {/* Order Placed */}
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: order.createdAt ? colors.primary : colors.surface,
                          borderWidth: 2,
                          borderColor: order.createdAt ? colors.primary : colors.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Ionicons 
                            name="cube-outline" 
                            size={20} 
                            color={order.createdAt ? "#fff" : colors.textTertiary} 
                          />
                        </View>
                      </View>

                      {/* Confirmed */}
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: order.confirmedAt ? colors.primary : colors.surface,
                          borderWidth: 2,
                          borderColor: order.confirmedAt ? colors.primary : colors.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Ionicons 
                            name="checkmark-circle-outline" 
                            size={20} 
                            color={order.confirmedAt ? "#fff" : colors.textTertiary} 
                          />
                        </View>
                      </View>

                      {/* Shipping */}
                      {!order.cancelledAt && (
                        <View style={{ alignItems: "center", flex: 1 }}>
                          <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: order.shippingAt ? colors.primary : colors.surface,
                            borderWidth: 2,
                            borderColor: order.shippingAt ? colors.primary : colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <Ionicons 
                              name="car-outline" 
                              size={20} 
                              color={order.shippingAt ? "#fff" : colors.textTertiary} 
                            />
                          </View>
                        </View>
                      )}

                      {/* Completed/Cancelled */}
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: order.cancelledAt 
                            ? colors.error 
                            : order.completedAt 
                            ? colors.success 
                            : colors.surface,
                          borderWidth: 2,
                          borderColor: order.cancelledAt 
                            ? colors.error 
                            : order.completedAt 
                            ? colors.success 
                            : colors.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Ionicons 
                            name={order.cancelledAt ? "close-circle-outline" : "checkmark-done-outline"} 
                            size={20} 
                            color={order.cancelledAt || order.completedAt ? "#fff" : colors.textTertiary} 
                          />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Step Labels */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center" }}>
                        Order Placed
                      </Text>
                      {order.createdAt && (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                          {formatDateTimeWithTime(order.createdAt)}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center" }}>
                        Confirmed
                      </Text>
                      {order.confirmedAt && (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                          {formatDateTimeWithTime(order.confirmedAt)}
                        </Text>
                      )}
                    </View>
                    {!order.cancelledAt && (
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center" }}>
                          Shipping
                        </Text>
                        {order.shippingAt && (
                          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                            {formatDateTimeWithTime(order.shippingAt)}
                          </Text>
                        )}
                      </View>
                    )}
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, textAlign: "center" }}>
                        {order.cancelledAt ? "Cancelled" : "Completed"}
                      </Text>
                      {(order.completedAt || order.cancelledAt) && (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                          {formatDateTimeWithTime(order.completedAt || order.cancelledAt)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Action Section */}
              {!order.cancelledAt && (
                <View style={{ 
                  borderRadius: 12, 
                  padding: 20, 
                  backgroundColor: colors.card, 
                  borderWidth: 1, 
                  borderColor: colors.border 
                }}>
                  <View style={{ gap: 16 }}>
                    <View style={{ gap: 12 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                        Delivery attempt should be made by {order.shippingAt ? formatDate(order.shippingAt) : "N/A"}
                      </Text>
                      <TouchableOpacity
                        onPress={handleChatWithSupport}
                        disabled={processing}
                        style={{
                          borderRadius: 10,
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          backgroundColor: colors.surface,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          opacity: processing ? 0.5 : 1,
                        }}
                        activeOpacity={0.8}
                      >
                        {processing ? (
                          <ActivityIndicator size="small" color={colors.text} />
                        ) : (
                          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
                        )}
                        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>
                          Chat with customer support
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                        Confirm order receive after you receive the goods successfully
                      </Text>
                    </View>
                    <View style={{ gap: 12 }}>
                      <TouchableOpacity
                        onPress={handleOrderReceived}
                        disabled={order.completedAt}
                        style={{
                          borderRadius: 10,
                          paddingVertical: 16,
                          backgroundColor: order.completedAt ? colors.surface : colors.primary,
                          opacity: order.completedAt ? 0.5 : 1,
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: "600", 
                          color: "#fff", 
                          textAlign: "center" 
                        }}>
                          {order.completedAt ? "Order Received" : "Order Received"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleRequestReturn}
                        style={{
                          borderRadius: 10,
                          paddingVertical: 16,
                          borderWidth: 2,
                          borderColor: colors.primary,
                          backgroundColor: "transparent",
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: "600", 
                          color: colors.primary, 
                          textAlign: "center" 
                        }}>
                          Request Return/Refund
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Delivery Address */}
              {(order.shipping || order.shippingAddress) && (
                <View style={{ 
                  borderRadius: 12, 
                  padding: 20, 
                  backgroundColor: colors.card, 
                  borderWidth: 1, 
                  borderColor: colors.border 
                }}>
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                    Delivery Address
                  </Text>
                  <View style={{ gap: 16 }}>
                    {/* Address Info */}
                    <View style={{ gap: 8 }}>
                      {fullName && (
                        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                          {fullName}
                        </Text>
                      )}
                      {order.shipping?.phoneNumber && (
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                          {order.shipping.phoneNumber}
                        </Text>
                      )}
                      {order.shipping?.address && (
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                          {order.shipping.address}
                          {order.shipping.city && `, ${order.shipping.city}`}
                        </Text>
                      )}
                      {order.shipping?.country && (
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                          {order.shipping.country}
                        </Text>
                      )}
                      {order.shippingAddress && !order.shipping && (
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                          <Ionicons name="location-outline" size={20} color={colors.textTertiary} />
                          <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>
                            {order.shippingAddress}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Timeline */}
                    <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <View style={{ position: "relative", paddingLeft: 20 }}>
                        {/* Vertical Line */}
                        <View style={{
                          position: "absolute",
                          left: 8,
                          top: 0,
                          bottom: 0,
                          width: 2,
                          backgroundColor: colors.border,
                        }} />

                        {/* Timeline Items */}
                        <View style={{ gap: 20 }}>
                          {/* Order Placed */}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                            <View style={{
                              position: "absolute",
                              left: -12,
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: colors.primary,
                              borderWidth: 2,
                              borderColor: colors.card,
                              alignItems: "center",
                              justifyContent: "center",
                              zIndex: 1,
                            }}>
                              <Ionicons name="cube" size={12} color="#fff" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 20 }}>
                              <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                                {formatDateTimeWithTime(order.createdAt)}
                              </Text>
                              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                                Order placed
                              </Text>
                            </View>
                          </View>

                          {/* Confirmed */}
                          {order.confirmedAt && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <View style={{
                                position: "absolute",
                                left: -12,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: colors.primary,
                                borderWidth: 2,
                                borderColor: colors.card,
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1,
                              }}>
                                <Ionicons name="checkmark-circle" size={12} color="#fff" />
                              </View>
                              <View style={{ flex: 1, marginLeft: 20 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                                  {formatDateTimeWithTime(order.confirmedAt)}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                                  Shop confirmed
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Shipping */}
                          {order.shippingAt && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <View style={{
                                position: "absolute",
                                left: -12,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: colors.primary,
                                borderWidth: 2,
                                borderColor: colors.card,
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1,
                              }}>
                                <Ionicons name="car" size={12} color="#fff" />
                              </View>
                              <View style={{ flex: 1, marginLeft: 20 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                                  {formatDateTimeWithTime(order.shippingAt)}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                                  Shipping
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Completed */}
                          {order.completedAt && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <View style={{
                                position: "absolute",
                                left: -12,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: colors.success,
                                borderWidth: 2,
                                borderColor: colors.card,
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1,
                              }}>
                                <Ionicons name="checkmark-done" size={12} color="#fff" />
                              </View>
                              <View style={{ flex: 1, marginLeft: 20 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                                  {formatDateTimeWithTime(order.completedAt)}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                                  Completed
                                </Text>
                              </View>
                            </View>
                          )}

                          {/* Cancelled */}
                          {order.cancelledAt && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <View style={{
                                position: "absolute",
                                left: -12,
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: colors.error,
                                borderWidth: 2,
                                borderColor: colors.card,
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 1,
                              }}>
                                <Ionicons name="close-circle" size={12} color="#fff" />
                              </View>
                              <View style={{ flex: 1, marginLeft: 20 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
                                  {formatDateTimeWithTime(order.cancelledAt)}
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                                  Cancelled
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </MainLayout>
  );
}

