import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import { getMyShorts, deleteShort } from "../../services/shortService";

export default function MyShortsScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShort, setSelectedShort] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchMyShorts();
  }, [filter, page]);

  const fetchMyShorts = async () => {
    try {
      setLoading(page === 1);
      const result = await getMyShorts(
        page,
        20,
        filter !== "all" ? filter : undefined
      );

      if (result.success) {
        if (page === 1) {
          setShorts(result.data || []);
        } else {
          setShorts((prev) => [...prev, ...(result.data || [])]);
        }
        setHasMore(
          result.pagination
            ? page < result.pagination.pages
            : (result.data || []).length === 20
        );
      } else {
        Alert.alert("Error", result.message || "Failed to load shorts");
      }
    } catch (error) {
      console.error("Fetch my shorts error:", error);
      Alert.alert("Error", "Failed to load shorts");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (shortId) => {
    try {
      setDeleting(true);
      const result = await deleteShort(shortId);
      if (result.success) {
        setShorts(shorts.filter((s) => s._id !== shortId));
        setShowDeleteModal(false);
        setSelectedShort(null);
        Alert.alert("Success", "Short deleted successfully");
      } else {
        Alert.alert("Error", result.message || "Failed to delete short");
      }
    } catch (error) {
      console.error("Delete short error:", error);
      Alert.alert("Error", "Failed to delete short");
    } finally {
      setDeleting(false);
    }
  };

  const filteredShorts = shorts.filter(
    (short) =>
      short.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      short.hashtags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const getPrivacyBadge = (privacy) => {
    const badges = {
      public: { bg: "#10B981", text: "#fff" },
      friends: { bg: "#3B82F6", text: "#fff" },
      private: { bg: "#6B7280", text: "#fff" },
    };
    return badges[privacy] || badges.public;
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setShorts([]);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const renderShortItem = ({ item: short }) => {
    const privacyBadge = getPrivacyBadge(short.privacy);
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("Shorts", { shortId: short._id })}
        style={{
          width: "48%",
          aspectRatio: 9 / 16,
          marginBottom: 16,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.surface || "#1F2937",
        }}
      >
        <Image
          source={{
            uri: getFullUrl(short.thumbnailUrl) || "https://via.placeholder.com/400",
          }}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
          }}
          resizeMode="cover"
        />

        {/* Overlay */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            justifyContent: "space-between",
            padding: 8,
          }}
        >
          {/* Top Info */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View
              style={{
                backgroundColor: privacyBadge.bg,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
              }}
            >
              <Text
                style={{
                  color: privacyBadge.text,
                  fontSize: 10,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {short.privacy}
              </Text>
            </View>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                setSelectedShort(short);
                setShowDeleteModal(true);
              }}
              style={{
                backgroundColor: "#EF4444",
                padding: 6,
                borderRadius: 20,
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Info */}
          <View>
            {short.caption && (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: "600",
                  marginBottom: 4,
                }}
                numberOfLines={2}
              >
                {short.caption}
              </Text>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="eye-outline" size={12} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 10 }}>
                    {short.views || 0}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="heart-outline" size={12} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 10 }}>
                    {(short.likes || []).length}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="chatbubble-outline" size={12} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 10 }}>
                    {short.commentsCount || 0}
                  </Text>
                </View>
              </View>
            </View>

            {short.hashtags && short.hashtags.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 4,
                  marginTop: 4,
                }}
              >
                {short.hashtags.slice(0, 2).map((tag, index) => (
                  <Text key={index} style={{ color: "#60A5FA", fontSize: 10 }}>
                    #{tag}
                  </Text>
                ))}
                {short.hashtags.length > 2 && (
                  <Text style={{ color: "#9CA3AF", fontSize: 10 }}>
                    +{short.hashtags.length - 2}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background || "#000" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border || "#374151",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text || "#fff"} />
          </TouchableOpacity>
          <View>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text || "#fff",
              }}
            >
              My Shorts
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary || "#9CA3AF",
              }}
            >
              {filteredShorts.length}{" "}
              {filteredShorts.length === 1 ? "short" : "shorts"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("CreateShort")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.primary || "#3B82F6",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={{ padding: 16, gap: 12 }}>
        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surface || "#1F2937",
            borderRadius: 12,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary || "#9CA3AF"} />
          <TextInput
            style={{
              flex: 1,
              color: colors.text || "#fff",
              fontSize: 14,
              paddingVertical: 10,
            }}
            placeholder="Search by caption or hashtags..."
            placeholderTextColor={colors.textSecondary || "#9CA3AF"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {["all", "public", "friends", "private"].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              onPress={() => handleFilterChange(filterOption)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor:
                  filter === filterOption
                    ? colors.primary || "#3B82F6"
                    : colors.surface || "#1F2937",
              }}
            >
              <Text
                style={{
                  color:
                    filter === filterOption
                      ? "#fff"
                      : colors.text || "#fff",
                  fontWeight: "600",
                  fontSize: 14,
                  textTransform: "capitalize",
                }}
              >
                {filterOption}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading && page === 1 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary || "#3B82F6"} />
        </View>
      ) : filteredShorts.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <Ionicons
            name="videocam-outline"
            size={64}
            color={colors.textSecondary || "#9CA3AF"}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.text || "#fff",
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            No shorts found
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary || "#9CA3AF",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {searchQuery
              ? "Try different search terms"
              : "Start creating your first short!"}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateShort")}
              style={{
                backgroundColor: colors.primary || "#3B82F6",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Create Short
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          <FlatList
            data={filteredShorts}
            renderItem={renderShortItem}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={{
              padding: 16,
              gap: 16,
            }}
            columnWrapperStyle={{ justifyContent: "space-between" }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              hasMore && loading ? (
                <View style={{ padding: 16, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary || "#3B82F6"} />
                </View>
              ) : null
            }
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowDeleteModal(false);
          setSelectedShort(null);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card || "#1F2937",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text || "#fff",
                marginBottom: 16,
              }}
            >
              Delete Short?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.textSecondary || "#9CA3AF",
                marginBottom: 24,
              }}
            >
              Are you sure you want to delete this short? This action cannot be
              undone.
            </Text>

            {selectedShort?.caption && (
              <View
                style={{
                  backgroundColor: colors.surface || "#111827",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.text || "#fff",
                  }}
                  numberOfLines={2}
                >
                  "{selectedShort.caption}"
                </Text>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedShort(null);
                }}
                disabled={deleting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: colors.surface || "#374151",
                  borderRadius: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.text || "#fff",
                    fontWeight: "600",
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(selectedShort?._id)}
                disabled={deleting}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: "#EF4444",
                  borderRadius: 8,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {deleting ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Deleting...
                    </Text>
                  </>
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
