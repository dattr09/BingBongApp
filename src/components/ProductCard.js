import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeSafe } from "../utils/themeHelper";
import { getFullUrl } from "../utils/getPic";

const formatPrice = (price) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function ProductCard({ product, shop, onPress, colors, viewMode = "grid" }) {
  const selectedVariant = product.variants?.[0];
  const imageUrl = selectedVariant?.image || product.images?.[0] || null;
  const price = selectedVariant?.price || product.basePrice || 0;
  const discount = product.discount || 0;
  const finalPrice = discount > 0 ? price - (price * discount) / 100 : price;
  const rating = product.totalRating || 0;
  const ratingCount = product.ratings?.length || 0;
  const isGrid = viewMode === "grid";

  if (!isGrid) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={{
          borderRadius: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          marginBottom: 16,
          flexDirection: "row",
          padding: 12,
          gap: 12,
        }}
        activeOpacity={0.8}
      >
        {/* Image */}
        <View style={{ position: "relative", width: 112, height: 112, flexShrink: 0 }}>
          <Image
            source={{ uri: getFullUrl(imageUrl) }}
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
            resizeMode="cover"
          />
          {discount > 0 && (
            <View
              style={{
                position: "absolute",
                top: 4,
                left: 4,
                backgroundColor: "#f97316",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
                -{discount}%
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          {/* Category */}
          {product.category && (
            <Text
              style={{
                fontSize: 10,
                fontWeight: "600",
                color: colors.primary,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              {product.category}
            </Text>
          )}

          {/* Name */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 6,
            }}
            numberOfLines={2}
          >
            {product.name}
          </Text>

          {/* Rating */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Ionicons
                key={i}
                name={i <= Math.round(rating) ? "star" : "star-outline"}
                size={12}
                color={i <= Math.round(rating) ? "#fbbf24" : colors.textTertiary}
              />
            ))}
            {ratingCount > 0 && (
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  marginLeft: 4,
                }}
              >
                ({ratingCount})
              </Text>
            )}
          </View>

          {/* Price */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: colors.error,
              }}
            >
              {formatPrice(finalPrice)}
            </Text>
            {discount > 0 && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textTertiary,
                  textDecorationLine: "line-through",
                }}
              >
                {formatPrice(price)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        marginBottom: 16,
        width: "48%",
      }}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={{ position: "relative", width: "100%", height: 200 }}>
        <Image
          source={{ uri: getFullUrl(imageUrl) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
        {discount > 0 && (
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              backgroundColor: "#f97316",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              -{discount}%
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={{ padding: 12 }}>
        {/* Category */}
        {product.category && (
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: colors.primary,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {product.category}
          </Text>
        )}

        {/* Name */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: colors.text,
            marginBottom: 6,
          }}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        {/* Rating */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Ionicons
              key={i}
              name={i <= Math.round(rating) ? "star" : "star-outline"}
              size={14}
              color={i <= Math.round(rating) ? "#fbbf24" : colors.textTertiary}
            />
          ))}
          {ratingCount > 0 && (
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                marginLeft: 4,
              }}
            >
              ({ratingCount})
            </Text>
          )}
        </View>

        {/* Price */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.error,
            }}
          >
            {formatPrice(finalPrice)}
          </Text>
          {discount > 0 && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textTertiary,
                textDecorationLine: "line-through",
              }}
            >
              {formatPrice(price)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

