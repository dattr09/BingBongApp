import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useThemeSafe } from "../../utils/themeHelper";
import { updateUserInfo } from "../../services/profileService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useThemeSafe();
  const { user } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [showEdu, setShowEdu] = useState(!!user?.education);
  const [showWork, setShowWork] = useState(!!user?.work);
  const [showSocial, setShowSocial] = useState(
    Array.isArray(user?.socialLinks) && user.socialLinks.length > 0
  );

  const [formData, setFormData] = useState({
    bio: user?.bio || "",
    address: user?.address || "",
    website: user?.website || "",
    phoneNumber: user?.phoneNumber || "",
    education: user?.education || { school: "", major: "", year: "" },
    work: user?.work || { company: "", position: "", duration: "" },
    socialLinks: user?.socialLinks || [],
  });

  useEffect(() => {
    if (!user) {
      Toast.show({ type: "error", text1: "User data not found" });
      navigation.goBack();
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (section, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const handleSocialChange = (index, key, value) => {
    const updated = [...formData.socialLinks];
    if (!updated[index]) {
      updated[index] = { platform: "", url: "" };
    }
    updated[index][key] = value;
    setFormData((prev) => ({ ...prev, socialLinks: updated }));
  };

  const addSocialLink = () => {
    setShowSocial(true);
    setFormData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: "", url: "" }],
    }));
  };

  const removeSocialLink = (index) => {
    const updated = formData.socialLinks.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, socialLinks: updated }));
    if (updated.length === 0) setShowSocial(false);
  };

  const handleSave = async () => {
    const updatedUser = {
      bio: formData.bio,
      address: formData.address,
      website: formData.website,
      phoneNumber: formData.phoneNumber,
      education: showEdu ? formData.education : {},
      work: showWork ? formData.work : {},
      socialLinks: showSocial ? formData.socialLinks : [],
    };

    try {
      setLoading(true);
      const res = await updateUserInfo(user._id, updatedUser);
      if (res.success) {
        // Update current user in storage
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const currentUser = JSON.parse(storedUser);
          const updatedCurrentUser = {
            ...currentUser,
            ...updatedUser,
          };
          await AsyncStorage.setItem("user", JSON.stringify(updatedCurrentUser));
        }

        Toast.show({ type: "success", text1: "Profile updated successfully!" });
        navigation.goBack();
      } else {
        Toast.show({ type: "error", text1: res.message || "Failed to update profile" });
      }
    } catch (error) {
      console.error("Update profile error:", error);
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "An error occurred while updating profile",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text }}>
          Edit Information
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{ padding: 8 }}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary }}>
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Bio */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
            Bio
          </Text>
          <TextInput
            value={formData.bio}
            onChangeText={(value) => handleChange("bio", value)}
            placeholder="Write a short introduction..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: colors.text,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Address & Website */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
              Address
            </Text>
            <TextInput
              value={formData.address}
              onChangeText={(value) => handleChange("address", value)}
              placeholder="Enter your address"
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: colors.text,
              }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
              Website
            </Text>
            <TextInput
              value={formData.website}
              onChangeText={(value) => handleChange("website", value)}
              placeholder="Enter your website URL"
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 15,
                color: colors.text,
              }}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>
            Phone Number
          </Text>
          <TextInput
            value={formData.phoneNumber}
            onChangeText={(value) => handleChange("phoneNumber", value)}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.textTertiary}
            keyboardType="phone-pad"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              color: colors.text,
            }}
          />
        </View>

        {/* Education */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
              Education
            </Text>
            {!showEdu && (
              <TouchableOpacity
                onPress={() => setShowEdu(true)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "500" }}>
                  + Add education
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {showEdu && (
            <View style={{ gap: 12 }}>
              <TextInput
                value={formData.education.school || ""}
                onChangeText={(value) => handleNestedChange("education", "school", value)}
                placeholder="School"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
              <TextInput
                value={formData.education.major || ""}
                onChangeText={(value) => handleNestedChange("education", "major", value)}
                placeholder="Major"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
              <TextInput
                value={formData.education.year || ""}
                onChangeText={(value) => handleNestedChange("education", "year", value)}
                placeholder="Study period (e.g., 2019 - 2023)"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
            </View>
          )}
        </View>

        {/* Work */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
              Work
            </Text>
            {!showWork && (
              <TouchableOpacity
                onPress={() => setShowWork(true)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "500" }}>
                  + Add work
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {showWork && (
            <View style={{ gap: 12 }}>
              <TextInput
                value={formData.work.company || ""}
                onChangeText={(value) => handleNestedChange("work", "company", value)}
                placeholder="Company"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
              <TextInput
                value={formData.work.position || ""}
                onChangeText={(value) => handleNestedChange("work", "position", value)}
                placeholder="Position"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
              <TextInput
                value={formData.work.duration || ""}
                onChangeText={(value) => handleNestedChange("work", "duration", value)}
                placeholder="Work period (e.g., 2021 - Present)"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 15,
                  color: colors.text,
                }}
              />
            </View>
          )}
        </View>

        {/* Social Links */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
              Social Media
            </Text>
            {!showSocial && (
              <TouchableOpacity
                onPress={addSocialLink}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "500" }}>
                  + Add social link
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {showSocial && (
            <View style={{ gap: 12 }}>
              {formData.socialLinks.map((link, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <TextInput
                    value={link.platform || ""}
                    onChangeText={(value) => handleSocialChange(index, "platform", value)}
                    placeholder="Platform (Facebook, Instagram...)"
                    placeholderTextColor={colors.textTertiary}
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 15,
                      color: colors.text,
                    }}
                  />
                  <TextInput
                    value={link.url || ""}
                    onChangeText={(value) => handleSocialChange(index, "url", value)}
                    placeholder="Profile link"
                    placeholderTextColor={colors.textTertiary}
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      padding: 12,
                      fontSize: 15,
                      color: colors.text,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => removeSocialLink(index)}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      backgroundColor: colors.error + "20",
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={addSocialLink}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "500" }}>
                  + Add another link
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

