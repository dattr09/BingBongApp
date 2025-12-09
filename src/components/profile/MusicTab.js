import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { useThemeSafe } from "../../utils/themeHelper";
import {
  addUserRingtone,
  deleteUserRingtone,
  setActiveRingtone,
  renameUserRingtone,
  getRingtoneUrl,
} from "../../services/ringtoneService";
import { API_URL } from "@env";
import Toast from "react-native-toast-message";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

export default function MusicTab({ displayedUser, currentUser }) {
  const { colors } = useThemeSafe();
  const isOwnProfile = currentUser?._id === displayedUser?._id;
  const [ringtones, setRingtones] = useState(displayedUser?.ringtones || []);
  const [activeRingtone, setActiveRingtoneState] = useState(
    displayedUser?.activeRingtone
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [uploadName, setUploadName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [sound, setSound] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    setRingtones(displayedUser?.ringtones || []);
    setActiveRingtoneState(displayedUser?.activeRingtone);
  }, [displayedUser]);

  const filteredRingtones = ringtones.filter((ringtone) =>
    ringtone.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        if (file.size > 5 * 1024 * 1024) {
          Alert.alert("Error", "File must be smaller than 5MB");
          return;
        }
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
        setShowNameInput(true);
        // Store file URI for upload
        setPendingFileUri(file.uri);
      }
    } catch (error) {
      console.error("File select error:", error);
      Alert.alert("Error", "Unable to select file");
    }
  };

  const [pendingFileUri, setPendingFileUri] = useState(null);

  const handleUpload = async () => {
    if (!pendingFileUri || !uploadName.trim()) {
      Alert.alert("Error", "Please enter ringtone name");
      return;
    }

    setIsUploading(true);
    try {
      const result = await addUserRingtone(pendingFileUri, uploadName.trim());
      if (result.success) {
        Toast.show({ type: "success", text1: result.message });
        // Refresh profile to get updated ringtones
        setRingtones((prev) => [...prev, result.data]);
        setShowNameInput(false);
        setUploadName("");
        setPendingFileUri(null);
      } else {
        Toast.show({ type: "error", text1: result.message });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayPause = async (ringtoneId, url) => {
    try {
      if (playingId === ringtoneId && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingId(null);
      } else {
        if (sound) {
          await sound.unloadAsync();
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: getFullUrl(url) },
          { shouldPlay: true }
        );
        setSound(newSound);
        setPlayingId(ringtoneId);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPlayingId(null);
            setSound(null);
          }
        });
      }
    } catch (error) {
      console.error("Play error:", error);
      Alert.alert("Error", "Unable to play music");
    }
  };

  const handleSetActive = async (ringtoneId) => {
    try {
      const result = await setActiveRingtone(ringtoneId);
      if (result.success) {
        Toast.show({ type: "success", text1: result.message });
        setActiveRingtoneState(ringtoneId);
      } else {
        Toast.show({ type: "error", text1: result.message });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "An error occurred" });
    }
  };

  const handleDelete = async (ringtoneId) => {
    Alert.alert(
      "Confirm",
      "Are you sure you want to delete this ringtone?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteUserRingtone(ringtoneId);
              if (result.success) {
                Toast.show({ type: "success", text1: result.message });
                setRingtones((prev) =>
                  prev.filter((r) => r._id !== ringtoneId)
                );
                if (playingId === ringtoneId) {
                  if (sound) {
                    await sound.unloadAsync();
                    setSound(null);
                  }
                  setPlayingId(null);
                }
                if (activeRingtone === ringtoneId) {
                  setActiveRingtoneState(null);
                }
              } else {
                Toast.show({ type: "error", text1: result.message });
              }
            } catch (error) {
              Toast.show({ type: "error", text1: "An error occurred" });
            }
          },
        },
      ]
    );
  };

  const handleRename = async (ringtoneId, newName) => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    try {
      const result = await renameUserRingtone(ringtoneId, newName.trim());
      if (result.success) {
        Toast.show({ type: "success", text1: result.message });
        setRingtones((prev) =>
          prev.map((r) =>
            r._id === ringtoneId ? { ...r, name: newName.trim() } : r
          )
        );
        setEditingId(null);
        setEditName("");
      } else {
        Toast.show({ type: "error", text1: result.message });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "An error occurred" });
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-4" style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <View className="p-2 rounded-lg" style={{ backgroundColor: colors.primary + '15' }}>
              <Ionicons name="musical-notes" size={24} color={colors.primary} />
            </View>
            <View>
              <Text className="text-xl font-semibold" style={{ color: colors.text }}>
                Ringtones
              </Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {ringtones.length} ringtone{ringtones.length !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          {isOwnProfile && (
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.primary }}
              onPress={handleFileSelect}
              disabled={isUploading || showNameInput}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {showNameInput && (
          <View className="p-4 rounded-lg mb-4" style={{ backgroundColor: colors.surface }}>
            <Text className="text-sm font-medium mb-2" style={{ color: colors.text }}>
              Tên ringtone
            </Text>
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, color: colors.text }}
                value={uploadName}
                onChangeText={setUploadName}
                placeholder="Nhập tên ringtone..."
                placeholderTextColor={colors.textTertiary}
                autoFocus
              />
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.primary }}
                onPress={handleUpload}
                disabled={isUploading || !uploadName.trim()}
              >
                {isUploading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.surface }}
                onPress={() => {
                  setShowNameInput(false);
                  setUploadName("");
                  setPendingFileUri(null);
                }}
                disabled={isUploading}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {ringtones.length > 0 && !showNameInput && (
          <View className="relative">
            <Ionicons
              name="search"
              size={20}
              color={colors.textTertiary}
              style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
            />
            <TextInput
              className="w-full pl-10 pr-10 py-2.5 rounded-lg"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
              placeholder="Tìm ringtone..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery && (
              <TouchableOpacity
                className="absolute right-3 top-2.5"
                onPress={() => setSearchQuery("")}
              >
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <ScrollView className="flex-1 p-4" style={{ backgroundColor: colors.background }}>
        {ringtones.length === 0 ? (
          <View className="items-center py-20">
            <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: colors.surface }}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.primary} />
            </View>
            <Text className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
              No ringtones yet
            </Text>
            <Text className="text-center" style={{ color: colors.textSecondary }}>
              {isOwnProfile
                ? "Upload your first ringtone"
                : "This user hasn't uploaded any ringtones"}
            </Text>
          </View>
        ) : filteredRingtones.length === 0 ? (
          <View className="items-center py-20">
            <Text style={{ color: colors.textSecondary }}>No ringtones found</Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredRingtones.map((ringtone) => (
              <View
                key={ringtone._id}
                className="p-4 rounded-lg border-2"
                style={{
                  backgroundColor: activeRingtone === ringtone._id ? colors.primary + '15' : colors.card,
                  borderColor: activeRingtone === ringtone._id ? colors.primary : colors.border
                }}
              >
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.primary + '15' }}
                    onPress={() => handlePlayPause(ringtone._id, ringtone.url)}
                  >
                    <Ionicons
                      name={playingId === ringtone._id ? "pause" : "play"}
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <View className="flex-1">
                    {editingId === ringtone._id ? (
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          className="flex-1 px-2 py-1 rounded"
                          style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary, color: colors.text }}
                          value={editName}
                          onChangeText={setEditName}
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={() =>
                            handleRename(ringtone._id, editName)
                          }
                        >
                          <Ionicons name="checkmark" size={20} color={colors.success} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingId(null);
                            setEditName("");
                          }}
                        >
                          <Ionicons name="close" size={20} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <Text className="font-semibold" style={{ color: colors.text }}>
                          {ringtone.name}
                        </Text>
                        {activeRingtone === ringtone._id && (
                          <View className="flex-row items-center gap-1 mt-1">
                            <Ionicons name="volume-high" size={14} color={colors.primary} />
                            <Text className="text-xs" style={{ color: colors.primary }}>Active</Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  {isOwnProfile && editingId !== ringtone._id && (
                    <View className="flex-row gap-2">
                      {!activeRingtone || activeRingtone !== ringtone._id ? (
                        <TouchableOpacity
                          onPress={() => handleSetActive(ringtone._id)}
                        >
                          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(ringtone._id);
                          setEditName(ringtone.name);
                        }}
                      >
                        <Ionicons name="pencil" size={24} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(ringtone._id)}>
                        <Ionicons name="trash" size={24} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

