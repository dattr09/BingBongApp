import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import MainLayout from "../../components/MainLayout";
import SpinnerLoading from "../../components/SpinnerLoading";
import { useThemeSafe } from "../../utils/themeHelper";
import { getCart } from "../../services/cartService";
import { createOrder } from "../../services/orderService";
import { emitCartUpdate } from "../../utils/cartEventEmitter";
import { getUser } from "../../utils/storage";
import { getFullUrl } from "../../utils/getPic";
import { listCountries } from "../../utils/countryFlag";
import axios from "axios";
import Toast from "react-native-toast-message";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price || 0);
};

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [cities, setCities] = useState([]);
  const [isGetCities, setIsGetCities] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    country: "",
    city: "",
    address: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartRes, user] = await Promise.all([getCart(), getUser()]);
        if (cartRes.success) {
          setCart(cartRes.data);
        }
        setCurrentUser(user);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!shipping.country) {
        setCities([]);
        return;
      }
      setIsGetCities(true);
      try {
        const res = await axios.post(
          "https://countriesnow.space/api/v0.1/countries/cities",
          { country: shipping.country }
        );
        setCities(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch cities:", error);
        setCities([]);
      } finally {
        setIsGetCities(false);
      }
    };
    fetchCities();
  }, [shipping.country]);

  const handleShippingChange = (field, value) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (field === "country") {
      setShipping((prev) => ({ ...prev, city: "" }));
      setShowCountryDropdown(false);
    } else if (field === "city") {
      setShowCityDropdown(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      Toast.show({ type: "error", text1: "Your cart is empty!" });
      return;
    }

    if (
      !shipping.address ||
      !shipping.country ||
      !shipping.city ||
      !shipping.phoneNumber ||
      !shipping.firstName ||
      !shipping.lastName
    ) {
      Toast.show({
        type: "error",
        text1: "Please fill out all required shipping information!",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await createOrder({ shipping });
      if (res.success) {
        emitCartUpdate();
        setIsSuccessModalOpen(true);
        setTimeout(() => {
          navigation.navigate("Order");
        }, 2000);
      } else {
        Toast.show({ type: "error", text1: res.message || "Unable to place order" });
      }
    } catch (error) {
      console.error("Place order error:", error);
      Toast.show({ type: "error", text1: "An error occurred while placing order" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <SpinnerLoading />
      </MainLayout>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <MainLayout>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            Cart is empty
          </Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
        scrollEnabled={!showCountryDropdown && !showCityDropdown}
        onScrollBeginDrag={() => {
          if (!showCountryDropdown && !showCityDropdown) {
            setShowCountryDropdown(false);
            setShowCityDropdown(false);
          }
        }}
      >
        <View style={{ padding: 16 }}>
          {/* Contact Information */}
          <View
            style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Contact Information
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 16 }}>
              {currentUser?.fullName} ({currentUser?.email})
            </Text>
          </View>

          {/* Shipping Form */}
          <View
            style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 16,
              }}
            >
              Shipping Address
            </Text>

            {/* Address */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Address
              </Text>
              <TextInput
                placeholder="Enter your address"
                placeholderTextColor={colors.textTertiary}
                value={shipping.address}
                onChangeText={(value) => handleShippingChange("address", value)}
                multiline
                style={{
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                  minHeight: 80,
                }}
              />
            </View>

            {/* Country */}
            <View style={{ marginBottom: 16, position: "relative", zIndex: showCountryDropdown ? 1000 : 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Country / Region
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCountryDropdown(!showCountryDropdown);
                  setShowCityDropdown(false);
                }}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    placeholder="Select country"
                    placeholderTextColor={colors.textTertiary}
                    value={shipping.country}
                    editable={false}
                    pointerEvents="none"
                    style={{
                      flex: 1,
                      padding: 12,
                      fontSize: 15,
                      color: colors.text,
                    }}
                  />
                  <Ionicons
                    name={showCountryDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textTertiary}
                    style={{ marginRight: 12 }}
                  />
                </View>
              </TouchableOpacity>
              {showCountryDropdown && (
                <>
                  <TouchableWithoutFeedback
                    onPress={() => setShowCountryDropdown(false)}
                  >
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: -200,
                        zIndex: 999,
                      }}
                    />
                  </TouchableWithoutFeedback>
                  <View
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: 200,
                      marginTop: 4,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      zIndex: 1000,
                      elevation: 5,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                  >
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                      style={{ maxHeight: 200 }}
                    >
                      {listCountries.map((country, index) => (
                        <TouchableOpacity
                          key={`country-${index}`}
                          onPress={() => handleShippingChange("country", country.name)}
                          style={{
                            padding: 12,
                            borderBottomWidth: index < listCountries.length - 1 ? 1 : 0,
                            borderBottomColor: colors.border,
                            backgroundColor: shipping.country === country.name ? colors.primary + "20" : "transparent",
                          }}
                        >
                          <Text style={{ fontSize: 15, color: colors.text }}>
                            {country.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>

            {/* City */}
            <View style={{ marginBottom: 16, position: "relative", zIndex: showCityDropdown ? 1000 : 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                City {isGetCities && "(Loading...)"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (shipping.country && !isGetCities) {
                    setShowCityDropdown(!showCityDropdown);
                    setShowCountryDropdown(false);
                  }
                }}
                disabled={!shipping.country || isGetCities}
                style={{
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  opacity: !shipping.country || isGetCities ? 0.5 : 1,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    placeholder="Select city"
                    placeholderTextColor={colors.textTertiary}
                    value={shipping.city}
                    editable={false}
                    pointerEvents="none"
                    style={{
                      flex: 1,
                      padding: 12,
                      fontSize: 15,
                      color: colors.text,
                    }}
                  />
                  <Ionicons
                    name={showCityDropdown ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.textTertiary}
                    style={{ marginRight: 12 }}
                  />
                </View>
              </TouchableOpacity>
              {showCityDropdown && shipping.country && !isGetCities && cities.length > 0 && (
                <>
                  <TouchableWithoutFeedback
                    onPress={() => setShowCityDropdown(false)}
                  >
                    <View
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: -200,
                        zIndex: 999,
                      }}
                    />
                  </TouchableWithoutFeedback>
                  <View
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      maxHeight: 200,
                      marginTop: 4,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      zIndex: 1000,
                      elevation: 5,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                    }}
                  >
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={true}
                      keyboardShouldPersistTaps="handled"
                      style={{ maxHeight: 200 }}
                    >
                      {cities.map((cityName, index) => (
                        <TouchableOpacity
                          key={`city-${index}`}
                          onPress={() => handleShippingChange("city", cityName)}
                          style={{
                            padding: 12,
                            borderBottomWidth: index < cities.length - 1 ? 1 : 0,
                            borderBottomColor: colors.border,
                            backgroundColor: shipping.city === cityName ? colors.primary + "20" : "transparent",
                          }}
                        >
                          <Text style={{ fontSize: 15, color: colors.text }}>
                            {cityName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}
            </View>

            {/* Name */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  First Name
                </Text>
                <TextInput
                  placeholder="First name"
                  placeholderTextColor={colors.textTertiary}
                  value={shipping.firstName}
                  onChangeText={(value) => handleShippingChange("firstName", value)}
                  style={{
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 15,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Last Name
                </Text>
                <TextInput
                  placeholder="Last name"
                  placeholderTextColor={colors.textTertiary}
                  value={shipping.lastName}
                  onChangeText={(value) => handleShippingChange("lastName", value)}
                  style={{
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 15,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </View>
            </View>

            {/* Phone */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                Phone Number
              </Text>
              <TextInput
                placeholder="Phone number"
                placeholderTextColor={colors.textTertiary}
                value={shipping.phoneNumber}
                onChangeText={(value) => handleShippingChange("phoneNumber", value)}
                keyboardType="phone-pad"
                style={{
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.text,
                }}
              />
            </View>
          </View>

          {/* Cart Items */}
          <View
            style={{
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.text,
                marginBottom: 16,
              }}
            >
              Order Summary
            </Text>
            <ScrollView
              style={{ maxHeight: 300 }}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {cart.items.map((item, index) => {
                const selectedVariant = item.product?.variants?.find(
                  (v) => v._id === item.variant
                );
                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      marginBottom: index < cart.items.length - 1 ? 16 : 0,
                      paddingBottom: index < cart.items.length - 1 ? 16 : 0,
                      borderBottomWidth: index < cart.items.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View style={{ width: 80, height: 80, position: "relative" }}>
                      <Image
                        source={{
                          uri: getFullUrl(selectedVariant?.image || item.product?.images?.[0]),
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                        resizeMode="cover"
                      />
                      <View
                        style={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                          {item.quantity}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginBottom: 4,
                        }}
                      >
                        {item.product?.shop?.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: colors.text,
                          marginBottom: 4,
                        }}
                        numberOfLines={2}
                      >
                        {selectedVariant?.name || item.product?.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.textSecondary,
                          marginBottom: 8,
                        }}
                      >
                        {formatPrice(selectedVariant?.price || item.product?.basePrice)}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: colors.primary,
                      }}
                    >
                      {formatPrice(item.price)}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* Pricing Summary */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>Subtotal</Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                  {formatPrice(cart.total)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.textSecondary }}>
                  Shipping Fee
                </Text>
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#22c55e" }}>
                  Free
                </Text>
              </View>
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
                  Total
                </Text>
                <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary }}>
                  {formatPrice(cart.total)}
                </Text>
              </View>
            </View>
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={submitting}
            style={{
              borderRadius: 12,
              paddingVertical: 16,
              marginBottom: 20,
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
                Place Order
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 24,
              width: "80%",
              alignItems: "center",
            }}
          >
            <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "600",
                color: "#22c55e",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              Order placed successfully!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Thank you for shopping with us. Your order is currently being processed.
            </Text>
          </View>
        </View>
      )}
    </MainLayout>
  );
}
