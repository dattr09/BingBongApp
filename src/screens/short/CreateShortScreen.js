import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { useThemeSafe } from "../../utils/themeHelper";
import { createShort } from "../../services/shortService";

export default function CreateShortScreen() {
  const navigation = useNavigation();
  const { colors } = useThemeSafe();
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [musicName, setMusicName] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleVideoSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your media library to select a video."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 100 * 1024 * 1024) {
          Alert.alert("Error", "Video file size must be less than 100MB");
          return;
        }
        setVideoFile(asset);
        setVideoPreview(asset.uri);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to select video");
    }
  };

  const handleThumbnailSelect = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your media library to select a thumbnail."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setThumbnailFile(result.assets[0]);
        setThumbnailPreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking thumbnail:", error);
      Alert.alert("Error", "Failed to select thumbnail");
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const parseHashtags = (hashtagString) => {
    if (!hashtagString || hashtagString.trim() === "") return [];

    return hashtagString
      .split(/[\s,]+/)
      .filter((tag) => tag.startsWith("#"))
      .map((tag) => tag.substring(1).toLowerCase().trim())
      .filter((tag) => tag.length > 0);
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      Alert.alert("Error", "Please select a video file");
      return;
    }

    if (!thumbnailFile) {
      Alert.alert("Error", "Please select a thumbnail image");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      // Append video
      const videoUri = videoFile.uri;
      const videoName = videoUri.split("/").pop() || "video.mp4";
      const videoType = videoFile.mimeType || "video/mp4";
      formData.append("video", {
        uri: videoUri,
        name: videoName,
        type: videoType,
      });

      // Append thumbnail
      const thumbnailUri = thumbnailFile.uri;
      const thumbnailName = thumbnailUri.split("/").pop() || "thumbnail.jpg";
      const thumbnailType = thumbnailFile.mimeType || "image/jpeg";
      formData.append("thumbnail", {
        uri: thumbnailUri,
        name: thumbnailName,
        type: thumbnailType,
      });

      formData.append("caption", caption.trim());
      formData.append("privacy", privacy);

      // Parse and send hashtags as JSON string
      const parsedHashtags = parseHashtags(hashtags);
      if (parsedHashtags.length > 0) {
        formData.append("hashtags", JSON.stringify(parsedHashtags));
      }

      // Send music as JSON string
      if (musicName?.trim() || musicArtist?.trim()) {
        const musicData = {
          name: musicName.trim() || "",
          artist: musicArtist.trim() || "",
        };
        formData.append("music", JSON.stringify(musicData));
      }

      const result = await createShort(
        formData,
        (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Giới hạn progress tối đa 100%
            setUploadProgress(Math.min(progress, 100));
          }
        }
      );

      if (result.success) {
        // Navigate về Shorts và pass short mới để hiện lên đầu mà không cần reload
        const newShort = result.data;
        if (newShort) {
          navigation.navigate("Shorts", { newShort });
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert("Error", result.message || "Failed to upload short");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      Alert.alert("Error", "Failed to upload short");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const privacyOptions = [
    {
      value: "public",
      label: "Public",
      icon: "globe-outline",
      description: "Everyone can see",
    },
    {
      value: "friends",
      label: "Friends",
      icon: "people-outline",
      description: "Only friends",
    },
    {
      value: "private",
      label: "Private",
      icon: "lock-closed-outline",
      description: "Only you",
    },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background || "#000" }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
              <Ionicons
                name="arrow-back"
                size={24}
                color={colors.text || "#fff"}
              />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.text || "#fff",
              }}
            >
              Create Short
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!videoFile || !thumbnailFile || uploading}
            style={{
              backgroundColor:
                videoFile && thumbnailFile && !uploading
                  ? colors.primary || "#3B82F6"
                  : "#6B7280",
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  {uploadProgress}%
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Post
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, gap: 16 }}
        >
          {/* Video Upload */}
          <View
            style={{
              backgroundColor: colors.card || "#1F2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text || "#fff",
                marginBottom: 12,
              }}
            >
              Video *
            </Text>

            {!videoPreview ? (
              <TouchableOpacity
                onPress={handleVideoSelect}
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: colors.border || "#374151",
                  borderRadius: 12,
                  padding: 32,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="videocam-outline"
                  size={48}
                  color={colors.textSecondary || "#9CA3AF"}
                />
                <Text
                  style={{
                    color: colors.text || "#fff",
                    fontWeight: "500",
                    marginTop: 12,
                    marginBottom: 4,
                  }}
                >
                  Tap to upload video
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary || "#9CA3AF",
                  }}
                >
                  MP4, MOV, AVI, MKV, WEBM (Max 100MB)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ position: "relative" }}>
                <Video
                  source={{ uri: videoPreview }}
                  style={{
                    width: "100%",
                    height: 200,
                    borderRadius: 12,
                    backgroundColor: "#000",
                  }}
                  useNativeControls
                  resizeMode="contain"
                />
                <TouchableOpacity
                  onPress={removeVideo}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "#EF4444",
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Thumbnail Upload */}
          <View
            style={{
              backgroundColor: colors.card || "#1F2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text || "#fff",
                marginBottom: 12,
              }}
            >
              Thumbnail *
            </Text>

            {!thumbnailPreview ? (
              <TouchableOpacity
                onPress={handleThumbnailSelect}
                style={{
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: colors.border || "#374151",
                  borderRadius: 12,
                  padding: 24,
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name="image-outline"
                  size={36}
                  color={colors.textSecondary || "#9CA3AF"}
                />
                <Text
                  style={{
                    color: colors.text || "#fff",
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  Upload thumbnail image
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary || "#9CA3AF",
                    marginTop: 4,
                  }}
                >
                  JPG, PNG, WEBP (Recommended: 9:16 ratio)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ position: "relative" }}>
                <Image
                  source={{ uri: thumbnailPreview }}
                  style={{
                    width: "100%",
                    height: 150,
                    borderRadius: 12,
                    backgroundColor: "#000",
                  }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={removeThumbnail}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "#EF4444",
                    borderRadius: 20,
                    padding: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Caption */}
          <View
            style={{
              backgroundColor: colors.card || "#1F2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text || "#fff",
                marginBottom: 12,
              }}
            >
              Caption
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface || "#111827",
                borderRadius: 8,
                padding: 12,
                color: colors.text || "#fff",
                minHeight: 100,
                textAlignVertical: "top",
                borderWidth: 1,
                borderColor: colors.border || "#374151",
              }}
              placeholder="Write a caption..."
              placeholderTextColor={colors.textSecondary || "#9CA3AF"}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={2200}
            />
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary || "#9CA3AF",
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {caption.length}/2200
            </Text>
          </View>

          {/* Hashtags */}
          <View
            style={{
              backgroundColor: colors.card || "#1F2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text || "#fff",
                marginBottom: 12,
              }}
            >
              Hashtags
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface || "#111827",
                borderRadius: 8,
                padding: 12,
                color: colors.text || "#fff",
                borderWidth: 1,
                borderColor: colors.border || "#374151",
              }}
              placeholder="#trending #viral #fyp"
              placeholderTextColor={colors.textSecondary || "#9CA3AF"}
              value={hashtags}
              onChangeText={setHashtags}
            />
            <Text
              style={{
                fontSize: 11,
                color: colors.textSecondary || "#9CA3AF",
                marginTop: 4,
              }}
            >
              Separate hashtags with spaces or commas
            </Text>
          </View>

          {/* Music */}
          <View
            style={{
              backgroundColor: colors.card || "#1F2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <Ionicons
                name="musical-notes-outline"
                size={16}
                color={colors.text || "#fff"}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.text || "#fff",
                }}
              >
                Music (Optional)
              </Text>
            </View>
            <View style={{ gap: 12 }}>
              <TextInput
                style={{
                  backgroundColor: colors.surface || "#111827",
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text || "#fff",
                  borderWidth: 1,
                  borderColor: colors.border || "#374151",
                }}
                placeholder="Song name"
                placeholderTextColor={colors.textSecondary || "#9CA3AF"}
                value={musicName}
                onChangeText={setMusicName}
              />
              <TextInput
                style={{
                  backgroundColor: colors.surface || "#111827",
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text || "#fff",
                  borderWidth: 1,
                  borderColor: colors.border || "#374151",
                }}
                placeholder="Artist name"
                placeholderTextColor={colors.textSecondary || "#9CA3AF"}
                value={musicArtist}
                onChangeText={setMusicArtist}
              />
            </View>
          </View>

          {/* Privacy */}
          <View
            style={{
              backgroundColor: colors.card || "#1F2937",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.text || "#fff",
                marginBottom: 12,
              }}
            >
              Privacy
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              {privacyOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setPrivacy(option.value)}
                  style={{
                    flex: 1,
                    minWidth: "30%",
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor:
                      privacy === option.value
                        ? colors.primary || "#3B82F6"
                        : colors.border || "#374151",
                    backgroundColor:
                      privacy === option.value
                        ? `${colors.primary}20` || "rgba(59, 130, 246, 0.2)"
                        : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={
                      privacy === option.value
                        ? colors.primary || "#3B82F6"
                        : colors.textSecondary || "#9CA3AF"
                    }
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color:
                        privacy === option.value
                          ? colors.primary || "#3B82F6"
                          : colors.text || "#fff",
                      marginTop: 8,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.textSecondary || "#9CA3AF",
                      marginTop: 4,
                      textAlign: "center",
                    }}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upload Progress */}
          {uploading && (
            <View
              style={{
                backgroundColor: colors.card || "#1F2937",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colors.text || "#fff",
                  }}
                >
                  Uploading...
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary || "#9CA3AF",
                  }}
                >
                  {uploadProgress}%
                </Text>
              </View>
              <View
                style={{
                  width: "100%",
                  height: 8,
                  backgroundColor: colors.surface || "#111827",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${uploadProgress}%`,
                    height: "100%",
                    backgroundColor: colors.primary || "#3B82F6",
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
