import React, { useState, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Modal, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import { getGroupPosts } from "../../services/postService";
import SpinnerLoading from "../SpinnerLoading";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING = 16;
const GAP = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * 2) / 3;

export default function MediaTab({ group }) {
  const { colors } = useThemeSafe();
  const [filterType, setFilterType] = useState("all");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [group?._id]);

  const fetchPosts = async () => {
    if (!group?._id) return;
    setLoading(true);
    try {
      const result = await getGroupPosts(group._id);
      if (result.success) {
        setPosts(result.data || []);
      }
    } catch (error) {
      console.error("Fetch posts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const allMedia = useMemo(() => {
    const mediaList = [];

    posts.forEach((post) => {
      if (post.media && post.media.length > 0) {
        post.media.forEach((mediaUrl, idx) => {
          const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl) || mediaUrl.includes("/video/upload/");
          mediaList.push({
            url: mediaUrl,
            type: isVideo ? "video" : "image",
            postId: post._id,
            postedBy: post.postedById,
            createdAt: post.createdAt,
            caption: post.content,
            index: idx,
          });
        });
      }
    });
    return mediaList;
  }, [posts]);

  const filteredMedia = useMemo(() => {
    if (filterType === "all") return allMedia;
    return allMedia.filter((media) => media.type === filterType);
  }, [allMedia, filterType]);

  const handleMediaClick = (media, idx) => {
    setSelectedMedia(media);
    setMediaIndex(idx);
  };

  const handleCloseModal = () => {
    setSelectedMedia(null);
  };

  if (loading) {
    return (
      <View style={{ minHeight: 400, alignItems: "center", justifyContent: "center" }}>
        <SpinnerLoading />
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Header Stats */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <StatCard
          icon="grid-outline"
          label="Total Media"
          value={allMedia.length}
          color={colors.primary}
          colors={colors}
        />
        <StatCard
          icon="image-outline"
          label="Images"
          value={allMedia.filter((m) => m.type === "image").length}
          color="#10b981"
          colors={colors}
        />
        <StatCard
          icon="videocam-outline"
          label="Videos"
          value={allMedia.filter((m) => m.type === "video").length}
          color="#a855f7"
          colors={colors}
        />
      </View>

      {/* Filter Bar */}
      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {["all", "image", "video"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setFilterType(type)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: filterType === type ? colors.primary : colors.surface,
                }}
                activeOpacity={0.7}
              >
                {type === "image" && <Ionicons name="image-outline" size={16} color={filterType === type ? "#fff" : colors.text} />}
                {type === "video" && <Ionicons name="videocam-outline" size={16} color={filterType === type ? "#fff" : colors.text} />}
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: filterType === type ? "#fff" : colors.text }}
                >
                  {type === "all" ? "All Media" : type.charAt(0).toUpperCase() + type.slice(1) + "s"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Showing <Text style={{ fontWeight: "bold" }}>{filteredMedia.length}</Text> items
          </Text>
        </View>
      </View>

      {/* Media Grid */}
      {filteredMedia.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 20, marginHorizontal: -GAP / 2 }}>
          {filteredMedia.map((media, idx) => (
            <TouchableOpacity
              key={`${media.postId}-${media.index}-${idx}`}
              onPress={() => handleMediaClick(media, idx)}
              style={{
                width: ITEM_WIDTH,
                height: ITEM_WIDTH,
                margin: GAP / 2,
                borderRadius: 10,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
              activeOpacity={0.8}
            >
              {media.type === "image" ? (
                <Image
                  source={{ uri: getFullUrl(media.url) }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
                  <Ionicons name="videocam" size={32} color={colors.textTertiary} />
                </View>
              )}

              {/* Media Type Badge */}
              {media.type === "video" && (
                <View style={{ position: "absolute", top: 8, right: 8, backgroundColor: "rgba(0, 0, 0, 0.7)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Ionicons name="videocam" size={12} color="#fff" />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#fff" }}>Video</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={{ borderRadius: 12, padding: 48, alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons
            name={filterType === "image" ? "image-outline" : filterType === "video" ? "videocam-outline" : "grid-outline"}
            size={48}
            color={colors.textTertiary}
          />
          <Text style={{ fontSize: 16, marginTop: 12, color: colors.textSecondary }}>
            No {filterType === "all" ? "media" : filterType + "s"} found
          </Text>
        </View>
      )}

      {/* Media Preview Modal */}
      {selectedMedia && (
        <Modal
          visible={!!selectedMedia}
          transparent={true}
          animationType="fade"
          onRequestClose={handleCloseModal}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.9)", alignItems: "center", justifyContent: "center" }}>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={{ position: "absolute", top: 48, right: 16, zIndex: 10, padding: 8 }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            {selectedMedia.type === "image" ? (
              <Image
                source={{ uri: getFullUrl(selectedMedia.url) }}
                style={{ width: "100%", height: "75%" }}
                resizeMode="contain"
              />
            ) : (
              <View style={{ width: "100%", height: "75%", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="videocam" size={64} color="#fff" />
                <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>Video preview coming soon</Text>
              </View>
            )}
          </View>
        </Modal>
      )}
    </View>
  );
}

function StatCard({ icon, label, value, color, colors }) {
  return (
    <View style={{ flex: 1, borderRadius: 12, padding: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ padding: 8, borderRadius: 10, marginBottom: 8, backgroundColor: color + '20' }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.text }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
        {label}
      </Text>
    </View>
  );
}
