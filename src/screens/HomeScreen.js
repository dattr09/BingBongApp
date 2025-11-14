import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
  Alert,
  Platform,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { postAPI } from "../services/postService"; // adjust path if needed

// PostsScreen: full-featured responsive feed + create post + post details + reactions + comments
export default function PostsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isLarge = width >= 768; // tablet breakpoint

  // feed state
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // create post modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newText, setNewText] = useState("");
  const [images, setImages] = useState([]);

  // selected post for details
  const [selectedPost, setSelectedPost] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // initial load
  useEffect(() => {
    fetchFeed(1);
  }, []);

  const fetchFeed = useCallback(
    async (pageToLoad = 1) => {
      try {
        if (pageToLoad === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        const res = await postAPI.getFeed(pageToLoad, limit);
        // assuming response shape: { success, data: { posts: [], total, page } }
        if (res && res.success) {
          if (pageToLoad === 1) setPosts(res.data.posts || []);
          else setPosts((prev) => [...prev, ...(res.data.posts || [])]);
          setPage(pageToLoad);
        } else {
          Alert.alert("Lỗi", res.message || "Không thể tải feed");
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Lỗi", err.message || "Không thể tải feed");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [limit]
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed(1);
  };

  const loadMore = () => {
    if (loadingMore || loading) return;
    fetchFeed(page + 1);
  };

  // Create post helpers
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Quyền bị từ chối", "Cần quyền truy cập ảnh để tải ảnh lên");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      // expo image picker v48+ returns an array in result.assets
      const picked = result.assets || [result];
      setImages((prev) => [...prev, ...picked]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Quyền bị từ chối", "Cần quyền truy cập camera");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      const picked = result.assets || [result];
      setImages((prev) => [...prev, ...picked]);
    }
  };

  const handleCreate = async () => {
    if (!newText.trim() && images.length === 0) {
      Alert.alert("Vui lòng nhập nội dung hoặc chọn ảnh");
      return;
    }
    try {
      setCreating(true);
      const form = new FormData();
      form.append("content", newText.trim());
      images.forEach((img, idx) => {
        // expo returns uri; need name and type
        const uri = img.uri || img.uri;
        const name = uri.split("/").pop();
        const match = /\.(\w+)$/.exec(name);
        const type = match ? `image/${match[1]}` : "image";
        form.append("images", { uri, name, type });
      });
      const res = await postAPI.createPost(form);
      if (res && res.success) {
        // prepend
        setPosts((prev) => [res.data.post, ...prev]);
        setShowCreate(false);
        setNewText("");
        setImages([]);
      } else {
        Alert.alert("Lỗi", res.message || "Tạo bài viết thất bại");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", err.message || "Tạo bài viết thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleReact = async (postId, type) => {
    try {
      const res = await postAPI.reactToPost(postId, type);
      if (res.success) {
        // optimistically update local post
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? { ...p, reactions: res.data.reactions || p.reactions }
              : p
          )
        );
      } else {
        Alert.alert("Lỗi", res.message || "Không thể thả cảm xúc");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể thả cảm xúc");
    }
  };

  const openPostDetails = async (postId) => {
    try {
      setDetailsLoading(true);
      const res = await postAPI.getPostById(postId);
      if (res && res.success) {
        setSelectedPost(res.data.post);
      } else {
        Alert.alert("Lỗi", res.message || "Không thể mở bài viết");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", err.message || "Không thể mở bài viết");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa bài viết?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await postAPI.deletePost(postId);
            if (res && res.success) {
              setPosts((prev) => prev.filter((p) => p._id !== postId));
              setSelectedPost(null);
            } else {
              Alert.alert("Lỗi", res.message || "Không thể xóa");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể xóa bài viết");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <PostItem
      post={item}
      onOpen={() => openPostDetails(item._id)}
      onReact={(type) => handleReact(item._id, type)}
      onDelete={() => handleDelete(item._id)}
      isLarge={isLarge}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isLarge && styles.headerLarge]}>
        <Text style={styles.title}>Feed</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          style={styles.createBtn}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && page === 1 ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={() =>
            loadingMore ? <ActivityIndicator style={{ margin: 12 }} /> : null
          }
          contentContainerStyle={{ padding: 12, paddingBottom: 60 }}
        />
      )}

      {/* Create Post Modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        onRequestClose={() => setShowCreate(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tạo bài viết</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Bạn đang nghĩ gì..."
            multiline
            value={newText}
            onChangeText={setNewText}
            style={styles.inputArea}
          />

          <View style={styles.mediaRow}>
            <TouchableOpacity onPress={pickImage} style={styles.mediaBtn}>
              <Ionicons name="image-outline" size={20} />
              <Text style={styles.mediaText}>Chọn ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={styles.mediaBtn}>
              <Ionicons name="camera-outline" size={20} />
              <Text style={styles.mediaText}>Chụp</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chipsRow}>
            {images.map((img, idx) => (
              <Image key={idx} source={{ uri: img.uri }} style={styles.thumb} />
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={() => {
                setNewText("");
                setImages([]);
              }}
              style={styles.clearBtn}
            >
              <Text>Xóa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              style={styles.submitBtn}
              disabled={creating}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {creating ? "Đang tạo..." : "Đăng"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Post Details Modal */}
      <Modal
        visible={!!selectedPost}
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết bài viết</Text>
            <TouchableOpacity onPress={() => setSelectedPost(null)}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          </View>

          {detailsLoading ? (
            <ActivityIndicator />
          ) : selectedPost ? (
            <View style={{ padding: 12, flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 16 }}>
                {selectedPost.author?.fullName || "Người dùng"}
              </Text>
              <Text style={{ marginTop: 8 }}>{selectedPost.content}</Text>
              <View
                style={{
                  flexDirection: "row",
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => handleReact(selectedPost._id, "like")}
                  style={{ marginRight: 12 }}
                >
                  <Ionicons name="heart-outline" size={22} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    /* focus comment input - omitted for brevity */
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={22} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => handleDelete(selectedPost._id)}
                >
                  <Ionicons name="trash-outline" size={22} color="red" />
                </TouchableOpacity>
              </View>

              {/* images */}
              <View style={{ marginTop: 12 }}>
                {(selectedPost.images || []).map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={{
                      width: "100%",
                      height: 220,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  />
                ))}
              </View>

              {/* TODO comments component - can call postAPI.getComments */}
            </View>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function PostItem({ post, onOpen, onReact, onDelete, isLarge }) {
  return (
    <View style={[styles.card, isLarge && styles.cardLarge]}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image source={{ uri: post.author?.avatar }} style={styles.avatar} />
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontWeight: "700" }}>{post.author?.fullName}</Text>
            <Text style={{ color: "#666", fontSize: 12 }}>
              {new Date(post.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onOpen}>
          <Ionicons name="ellipsis-vertical" size={18} />
        </TouchableOpacity>
      </View>

      <Text style={{ marginTop: 10 }}>{post.content}</Text>

      {(post.images || []).length > 0 && (
        <View style={styles.imagesRow}>
          {post.images.slice(0, 3).map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.postImage} />
          ))}
        </View>
      )}

      <View style={styles.cardFooter}>
        <TouchableOpacity
          onPress={() => onReact("like")}
          style={styles.iconBtn}
        >
          <Ionicons name="heart-outline" size={20} />
          <Text style={styles.iconText}>{post.reactions?.like || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onReact("love")}
          style={styles.iconBtn}
        >
          <Ionicons name="heart" size={20} color="tomato" />
          <Text style={styles.iconText}>{post.reactions?.love || 0}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => onDelete && onDelete(post._id)}>
          <Ionicons name="trash-outline" size={18} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7f7f8",
  },
  headerLarge: { height: 72 },
  title: { fontSize: 18, fontWeight: "700" },
  createBtn: { backgroundColor: "#4f46e5", padding: 8, borderRadius: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLarge: { padding: 18 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eee" },
  imagesRow: { flexDirection: "row", marginTop: 10, gap: 8 },
  postImage: { width: 100, height: 100, borderRadius: 8, marginRight: 8 },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  iconBtn: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  iconText: { marginLeft: 6, color: "#333" },
  modalContainer: { flex: 1, padding: 12, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  inputArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
  },
  mediaRow: { flexDirection: "row", marginTop: 12 },
  mediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  mediaText: { marginLeft: 8 },
  chipsRow: { flexDirection: "row", marginTop: 12, flexWrap: "wrap" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  clearBtn: { padding: 12 },
  submitBtn: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
});
