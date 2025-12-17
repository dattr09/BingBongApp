import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import { useNavigation } from "@react-navigation/native";

export default function MembersTab({ group }) {
  const { colors } = useThemeSafe();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const allMembers = useMemo(() => {
    const memberList = [];

    if (group.createdBy) {
      memberList.push({
        ...group.createdBy,
        role: "creator",
        isAdmin: true,
        isModerator: false
      });
    }

    group.admins?.forEach(admin => {
      if (admin._id !== group.createdBy?._id) {
        memberList.push({
          ...admin,
          role: "admin",
          isAdmin: true,
          isModerator: false
        });
      }
    });

    group.moderators?.forEach(mod => {
      if (!memberList.find(m => m._id === mod._id)) {
        memberList.push({
          ...mod,
          role: "moderator",
          isAdmin: false,
          isModerator: true
        });
      }
    });

    group.members?.forEach(member => {
      if (!memberList.find(m => m._id === member._id)) {
        memberList.push({
          ...member,
          role: "member",
          isAdmin: false,
          isModerator: false
        });
      }
    });

    return memberList;
  }, [group]);

  const filteredMembers = useMemo(() => {
    return allMembers.filter(member => {
      const fullName = member.fullName || member.name || "";
      const matchesSearch = fullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      const matchesRole = 
        roleFilter === "all" ||
        (roleFilter === "admin" && (member.role === "creator" || member.role === "admin")) ||
        (roleFilter === "moderator" && member.role === "moderator") ||
        (roleFilter === "member" && member.role === "member");

      return matchesSearch && matchesRole;
    });
  }, [allMembers, searchQuery, roleFilter]);

  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Header Stats */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <StatCard
          icon="people-outline"
          label="Total"
          value={group.members?.length || 0}
          color={colors.primary}
          colors={colors}
        />
        <StatCard
          icon="shield-checkmark-outline"
          label="Admins"
          value={group.admins?.length || 0}
          color="#a855f7"
          colors={colors}
        />
        <StatCard
          icon="star-outline"
          label="Mods"
          value={group.moderators?.length || 0}
          color="#ec4899"
          colors={colors}
        />
      </View>

      <View style={{ borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        {/* Search Input */}
        <View style={{ position: "relative", marginBottom: 12 }}>
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textTertiary}
            style={{ position: "absolute", left: 12, top: 12, zIndex: 1 }}
          />
          <TextInput
            placeholder="Search members..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ borderRadius: 10, paddingLeft: 40, paddingRight: 16, paddingVertical: 10, fontSize: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text }}
          />
        </View>

        {/* Role Filter */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="filter-outline" size={18} color={colors.textTertiary} />
          <View style={{ flexDirection: "row", flex: 1, gap: 8 }}>
            {["all", "admin", "moderator", "member"].map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setRoleFilter(role)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: roleFilter === role ? colors.primary : colors.surface,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{ fontSize: 12, fontWeight: "500", color: roleFilter === role ? "#fff" : colors.text }}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results Count */}
        <Text style={{ fontSize: 14, marginTop: 12, color: colors.textSecondary }}>
          Showing <Text style={{ fontWeight: "bold" }}>{filteredMembers.length}</Text> of <Text style={{ fontWeight: "bold" }}>{allMembers.length}</Text> members
        </Text>
      </View>

      {/* Members List */}
      {filteredMembers.length > 0 ? (
        <View>
          {filteredMembers.map((member) => (
            <TouchableOpacity
              key={member._id}
              onPress={() => navigation.navigate("Profile", { userSlug: member.slug })}
              style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                gap: 16, 
                padding: 16, 
                marginBottom: 12, 
                borderRadius: 12, 
                backgroundColor: colors.card, 
                borderWidth: 1, 
                borderColor: colors.border 
              }}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <View style={{ position: "relative", flexShrink: 0 }}>
                <Image
                  source={{ uri: getFullUrl(member.avatar) }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                />
                {/* Role Badge on Avatar */}
                {member.role === "creator" && (
                  <View style={{ position: "absolute", bottom: -2, right: -2, backgroundColor: "#fbbf24", borderRadius: 10, padding: 4 }}>
                    <Ionicons name="shield" size={14} color="#fff" />
                  </View>
                )}
                {member.role === "admin" && (
                  <View style={{ position: "absolute", bottom: -2, right: -2, backgroundColor: "#a855f7", borderRadius: 10, padding: 4 }}>
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                  </View>
                )}
                {member.role === "moderator" && (
                  <View style={{ position: "absolute", bottom: -2, right: -2, backgroundColor: "#3b82f6", borderRadius: 10, padding: 4 }}>
                    <Ionicons name="star" size={14} color="#fff" />
                  </View>
                )}
              </View>

              {/* Member Info */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", flex: 1, color: colors.text }} numberOfLines={1}>
                    {member.fullName || member.name}
                  </Text>
                  <RoleBadge role={member.role} colors={colors} />
                </View>
                <Text style={{ fontSize: 14, color: colors.textSecondary }} numberOfLines={1}>
                  @{member.slug}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={{ alignItems: "center", paddingVertical: 48 }}>
          <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
          <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>
            No members found matching your search
          </Text>
        </View>
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

function RoleBadge({ role, colors }) {
  const badges = {
    creator: {
      label: "Creator",
      bgColor: "#fbbf24",
      textColor: "#fff"
    },
    admin: {
      label: "Admin",
      bgColor: "#a855f7",
      textColor: "#fff"
    },
    moderator: {
      label: "Moderator",
      bgColor: "#3b82f6",
      textColor: "#fff"
    },
    member: {
      label: "Member",
      bgColor: colors.surface,
      textColor: colors.textSecondary
    }
  };

  const badge = badges[role] || badges.member;

  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: badge.bgColor }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: badge.textColor }}>
        {badge.label}
      </Text>
    </View>
  );
}
