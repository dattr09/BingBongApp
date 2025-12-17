import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import { useNavigation } from "@react-navigation/native";

export default function AboutTab({ group, currentUser }) {
  const { colors } = useThemeSafe();
  const navigation = useNavigation();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const MAX_LENGTH = 300;
  const description = group.description || "No description available for this group.";
  const shouldTruncate = description.length > MAX_LENGTH;
  const displayDescription = shouldTruncate && !showFullDescription
    ? description.slice(0, MAX_LENGTH) + "..."
    : description;
  const isGroupAdmin = currentUser && group.admins?.some(admin => admin._id === currentUser._id || admin === currentUser._id);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Description */}
      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 12, color: colors.text }}>
          About This Group
        </Text>
        <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>
          {displayDescription}
        </Text>
        {shouldTruncate && (
          <TouchableOpacity
            onPress={() => setShowFullDescription(!showFullDescription)}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary }}>
              {showFullDescription ? "See Less" : "See More"}
            </Text>
            <Ionicons
              name={showFullDescription ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Visibility */}
      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View style={{
            padding: 10,
            borderRadius: 10,
            backgroundColor: group.visibility === "public" ? "rgba(16, 185, 129, 0.1)" : colors.surface
          }}>
            {group.visibility === "public" ? (
              <Ionicons name="globe-outline" size={24} color="#10b981" />
            ) : (
              <Ionicons name="lock-closed-outline" size={24} color={colors.textTertiary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", textTransform: "capitalize", marginBottom: 4, color: colors.text }}>
              {group.visibility} Group
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              {group.visibility === "public"
                ? "Anyone can see who's in the group and what they post."
                : "Only members can see who's in the group and what they post."}
            </Text>
          </View>
        </View>
      </View>

      {/* Member Stats */}
      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
            Members
          </Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.primary }}>
              {group.members?.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Members
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#a855f7" }}>
              {group.admins?.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Admins
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#ec4899" }}>
              {group.moderators?.length || 0}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
              Mods
            </Text>
          </View>
        </View>
      </View>

      {/* Tags */}
      {group.tags && group.tags.length > 0 && (
        <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12, color: colors.text }}>
            Tags
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {group.tags.map((tag, idx) => (
              <View
                key={idx}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.primary + '20' }}
              >
                <Text style={{ fontSize: 14, fontWeight: "500", color: colors.primary }}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Admin */}
      {group.createdBy && (
        <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12, color: colors.text }}>
            Administrator
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Profile", { userSlug: group.createdBy.slug })}
            style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 10, backgroundColor: colors.surface }}
            activeOpacity={0.7}
          >
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: getFullUrl(group.createdBy.avatar) }}
                style={{ width: 48, height: 48, borderRadius: 24 }}
              />
              <View style={{ position: "absolute", bottom: -2, right: -2, backgroundColor: "#fbbf24", borderRadius: 10, padding: 2 }}>
                <Ionicons name="shield" size={12} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>
                {group.createdBy.fullName}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                Group Creator
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Rules */}
      {group.rules && group.rules.length > 0 && (
        <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12, color: colors.text }}>
            Rules
          </Text>
          <View style={{ gap: 12 }}>
            {group.rules.map((rule, idx) => (
              <View
                key={idx}
                style={{ borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 12, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.surface }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary }}>
                    <Text style={{ fontSize: 11, fontWeight: "bold", color: "#fff" }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                    {rule.title}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, paddingLeft: 28, color: colors.textSecondary, lineHeight: 20 }}>
                  {rule.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Members */}
      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12, color: colors.text }}>
          Recent Members
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {group.members?.slice(0, 12).map((mem) => (
            <TouchableOpacity
              key={mem._id}
              onPress={() => navigation.navigate("Profile", { userSlug: mem.slug })}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: getFullUrl(mem.avatar) }}
                style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border }}
              />
            </TouchableOpacity>
          ))}
          {group.members?.length > 12 && (
            <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary }}>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#fff" }}>
                +{group.members.length - 12}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Settings */}
      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12, color: colors.text }}>
          Settings
        </Text>
        <View style={{ gap: 12 }}>
          <SettingCard
            label="Members Can Post"
            value={group.settings?.allowMemberPost}
            colors={colors}
          />
          <SettingCard
            label="Post Approval"
            value={group.settings?.requirePostApproval}
            colors={colors}
          />
          <SettingCard
            label="Join Approval"
            value={group.settings?.requireJoinApproval}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}

function SettingCard({ label, value, colors }) {
  return (
    <View style={{
      padding: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: value ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
      backgroundColor: value ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Ionicons
          name={value ? "checkmark-circle" : "close-circle"}
          size={18}
          color={value ? "#10b981" : "#ef4444"}
        />
        <Text style={{
          fontSize: 14,
          fontWeight: "600",
          color: value ? "#10b981" : "#ef4444"
        }}>
          {value ? "On" : "Off"}
        </Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}
