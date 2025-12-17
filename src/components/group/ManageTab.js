import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeSafe } from "../../utils/themeHelper";
import { getFullUrl } from "../../utils/getPic";
import { approveMember, rejectMember, removeMember, manageRole } from "../../services/groupService";
import { getUser } from "../../utils/storage";
import Toast from "react-native-toast-message";

export default function ManageTab({ group, onGroupUpdate }) {
  const { colors } = useThemeSafe();
  const navigation = useNavigation();
  const [activeSection, setActiveSection] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [localGroup, setLocalGroup] = useState(group);

  React.useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    setLocalGroup(group);
  }, [group]);

  const isCreator = currentUser && localGroup?.createdBy?._id === currentUser._id;
  const isAdmin =
    currentUser && localGroup?.admins?.some((admin) => admin._id === currentUser._id || admin === currentUser._id);
  const isModerator =
    currentUser && localGroup?.moderators?.some((mod) => mod._id === currentUser._id || mod === currentUser._id);

  const filteredMembers = useMemo(() => {
    if (!localGroup?.members) return [];
    return localGroup.members.filter(
      (member) =>
        (member.fullName || member.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.slug || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localGroup?.members, searchQuery]);

  const filteredPending = useMemo(() => {
    if (!localGroup?.pendingMembers) return [];
    return localGroup.pendingMembers.filter(
      (member) =>
        (member.fullName || member.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.slug || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localGroup?.pendingMembers, searchQuery]);

  const getMemberRole = (memberId) => {
    if (localGroup?.createdBy?._id === memberId) return "Creator";
    if (localGroup?.admins?.some((admin) => admin._id === memberId || admin === memberId)) return "Admin";
    if (localGroup?.moderators?.some((mod) => mod._id === memberId || mod === memberId)) return "Moderator";
    return "Member";
  };

  const handleApproveMember = async (userId) => {
    setLoading(true);
    try {
      const result = await approveMember(localGroup._id, userId);
      if (result.success) {
        Toast.show({ type: "success", text1: "Member approved!" });

        const approvedMember = localGroup.pendingMembers.find((m) => m._id === userId || m === userId);
        setLocalGroup((prev) => ({
          ...prev,
          members: [...(prev.members || []), approvedMember].filter(Boolean),
          pendingMembers: (prev.pendingMembers || []).filter((m) => m._id !== userId && m !== userId),
        }));

        if (onGroupUpdate) {
          const updatedGroup = {
            ...localGroup,
            members: [...(localGroup.members || []), approvedMember].filter(Boolean),
            pendingMembers: (localGroup.pendingMembers || []).filter((m) => m._id !== userId && m !== userId),
          };
          onGroupUpdate(updatedGroup);
        }
      } else {
        Toast.show({ type: "error", text1: result.message || "Failed to approve member" });
      }
    } catch (error) {
      console.error("Approve member error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectMember = async (userId) => {
    setLoading(true);
    try {
      const result = await rejectMember(localGroup._id, userId);
      if (result.success) {
        Toast.show({ type: "success", text1: "Member rejected" });

        setLocalGroup((prev) => ({
          ...prev,
          pendingMembers: (prev.pendingMembers || []).filter((m) => m._id !== userId && m !== userId),
        }));

        if (onGroupUpdate) {
          const updatedGroup = {
            ...localGroup,
            pendingMembers: (localGroup.pendingMembers || []).filter((m) => m._id !== userId && m !== userId),
          };
          onGroupUpdate(updatedGroup);
        }
      } else {
        Toast.show({ type: "error", text1: result.message || "Failed to reject member" });
      }
    } catch (error) {
      console.error("Reject member error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    Alert.alert(
      "Remove Member",
      "Are you sure you want to remove this member?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await removeMember(localGroup._id, userId);
              if (result.success) {
                Toast.show({ type: "success", text1: "Member removed" });

                const updatedGroup = {
                  ...localGroup,
                  members: (localGroup.members || []).filter((m) => m._id !== userId && m !== userId),
                  admins: (localGroup.admins || []).filter((a) => a._id !== userId && a !== userId),
                  moderators: (localGroup.moderators || []).filter((m) => m._id !== userId && m !== userId),
                };
                setLocalGroup(updatedGroup);

                if (onGroupUpdate) {
                  onGroupUpdate(updatedGroup);
                }
              } else {
                Toast.show({ type: "error", text1: result.message || "Failed to remove member" });
              }
            } catch (error) {
              console.error("Remove member error:", error);
              Toast.show({ type: "error", text1: "An error occurred" });
            } finally {
              setLoading(false);
              setShowMenu(null);
            }
          },
        },
      ]
    );
  };

  const handleManageRole = async (userId, action, role) => {
    setLoading(true);
    try {
      const result = await manageRole(localGroup._id, userId, { action, role });
      if (result.success) {
        Toast.show({ type: "success", text1: `${role} ${action}ed successfully!` });
        if (result.data) {
          setLocalGroup(result.data);
          if (onGroupUpdate) {
            onGroupUpdate(result.data);
          }
        }
      } else {
        Toast.show({ type: "error", text1: result.message || "Failed to update role" });
      }
    } catch (error) {
      console.error("Manage role error:", error);
      Toast.show({ type: "error", text1: "An error occurred" });
    } finally {
      setLoading(false);
      setShowMenu(null);
    }
  };

  const canManageRoles = isCreator || isAdmin;
  const canRemoveMembers = isCreator || isAdmin || isModerator;
  const canApprovePending = isCreator || isAdmin || isModerator;

  if (!canManageRoles && !canRemoveMembers) {
    return (
      <View style={{ padding: 40, alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <Ionicons name="alert-triangle-outline" size={64} color={colors.textTertiary} />
        <Text style={{ marginTop: 16, fontSize: 20, fontWeight: "bold", color: colors.text }}>
          No Access
        </Text>
        <Text style={{ marginTop: 8, fontSize: 15, color: colors.textSecondary, textAlign: "center" }}>
          You don't have permission to manage this group.
        </Text>
      </View>
    );
  }

  const renderMember = ({ item: member }) => {
    const role = getMemberRole(member._id);
    const isCurrentUser = member._id === currentUser?._id;
    const isMemberCreator = member._id === localGroup?.createdBy?._id;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          marginBottom: 12,
          borderRadius: 12,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Profile", { userSlug: member.slug })}
          style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: getFullUrl(member.avatar) }}
            style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.border }}
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <Text style={{ fontWeight: "600", fontSize: 16, color: colors.text }} numberOfLines={1}>
                {member.fullName || member.name}
              </Text>
              {isCurrentUser && (
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>(You)</Text>
              )}
              {role !== "Member" && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor:
                      role === "Creator"
                        ? "rgba(251, 191, 36, 0.2)"
                        : role === "Admin"
                          ? "rgba(239, 68, 68, 0.2)"
                          : "rgba(59, 130, 246, 0.2)",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color:
                        role === "Creator"
                          ? "#fbbf24"
                          : role === "Admin"
                            ? "#ef4444"
                            : "#3b82f6",
                    }}
                  >
                    {role === "Creator" && "👑 "}
                    {role === "Admin" && "🛡️ "}
                    {role === "Moderator" && "⭐ "}
                    {role}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>
              @{member.slug || member.username}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        {!isCurrentUser && !isMemberCreator && canManageRoles && (
          <TouchableOpacity
            onPress={() => setShowMenu(showMenu === member._id ? null : member._id)}
            style={{ padding: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPendingMember = ({ item: member }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        backgroundColor: "rgba(251, 191, 36, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(251, 191, 36, 0.3)",
      }}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile", { userSlug: member.slug })}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getFullUrl(member.avatar) }}
          style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: "#fbbf24" }}
        />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontWeight: "600", fontSize: 16, color: colors.text }} numberOfLines={1}>
            {member.fullName || member.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary }} numberOfLines={1}>
            @{member.slug || member.username}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <TouchableOpacity
          onPress={() => handleApproveMember(member._id)}
          disabled={loading}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: "#10b981",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: loading ? 0.5 : 1,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRejectMember(member._id)}
          disabled={loading}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: "#ef4444",
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            opacity: loading ? 0.5 : 1,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
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
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: colors.text }}>
          Group Management
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary }}>
          Manage members, approve join requests, and assign roles
        </Text>
      </View>

      {/* Navigation Tabs */}
      <View
        style={{
          borderRadius: 12,
          marginBottom: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity
            onPress={() => setActiveSection("members")}
            style={{
              flex: 1,
              paddingVertical: 16,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderBottomWidth: activeSection === "members" ? 3 : 0,
              borderBottomColor: activeSection === "members" ? colors.primary : "transparent",
              backgroundColor: activeSection === "members" ? colors.surface : "transparent",
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={activeSection === "members" ? colors.primary : colors.textSecondary}
            />
            <Text
              style={{
                fontWeight: "600",
                fontSize: 15,
                color: activeSection === "members" ? colors.primary : colors.textSecondary,
              }}
            >
              Members ({localGroup?.members?.length || 0})
            </Text>
          </TouchableOpacity>

          {canApprovePending && (
            <TouchableOpacity
              onPress={() => setActiveSection("pending")}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderBottomWidth: activeSection === "pending" ? 3 : 0,
                borderBottomColor: activeSection === "pending" ? colors.primary : "transparent",
                backgroundColor: activeSection === "pending" ? colors.surface : "transparent",
                position: "relative",
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={activeSection === "pending" ? colors.primary : colors.textSecondary}
              />
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 15,
                  color: activeSection === "pending" ? colors.primary : colors.textSecondary,
                }}
              >
                Pending ({localGroup?.pendingMembers?.length || 0})
              </Text>
              {localGroup?.pendingMembers?.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#ef4444",
                  }}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ position: "relative" }}>
            <Ionicons
              name="search-outline"
              size={20}
              color={colors.textTertiary}
              style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}
            />
            <TextInput
              placeholder="Search members..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                borderRadius: 10,
                paddingLeft: 40,
                paddingRight: 16,
                paddingVertical: 12,
                fontSize: 15,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
          </View>
        </View>

        {/* Content */}
        <View style={{ padding: 16 }}>
          {activeSection === "members" && (
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
              renderItem={renderMember}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                  <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>
                    {searchQuery ? "No members found" : "No members yet"}
                  </Text>
                </View>
              }
            />
          )}

          {activeSection === "pending" && (
            <FlatList
              data={filteredPending}
              keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
              renderItem={renderPendingMember}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="time-outline" size={48} color={colors.textTertiary} />
                  <Text style={{ marginTop: 12, fontSize: 16, color: colors.textSecondary }}>
                    {searchQuery ? "No pending requests found" : "No pending join requests"}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>

      {/* Role Management Modal */}
      {showMenu && (
        <Modal
          visible={!!showMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMenu(null)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "center", alignItems: "center" }}
            activeOpacity={1}
            onPress={() => setShowMenu(null)}
          >
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 8,
                minWidth: 200,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onStartShouldSetResponder={() => true}
            >
              {(() => {
                const member = filteredMembers.find((m) => m._id === showMenu);
                if (!member) return null;
                const role = getMemberRole(member._id);
                const isMemberCreator = member._id === localGroup?.createdBy?._id;

                return (
                  <>
                    {isCreator && role !== "Admin" && !isMemberCreator && (
                      <TouchableOpacity
                        onPress={() => handleManageRole(member._id, "add", "admin")}
                        disabled={loading}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          opacity: loading ? 0.5 : 1,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="shield-checkmark" size={20} color="#ef4444" />
                        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Make Admin</Text>
                      </TouchableOpacity>
                    )}

                    {isCreator && role === "Admin" && (
                      <TouchableOpacity
                        onPress={() => handleManageRole(member._id, "remove", "admin")}
                        disabled={loading}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          opacity: loading ? 0.5 : 1,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={20} color={colors.text} />
                        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Remove Admin</Text>
                      </TouchableOpacity>
                    )}

                    {(isCreator || isAdmin) && role !== "Moderator" && role !== "Admin" && !isMemberCreator && (
                      <TouchableOpacity
                        onPress={() => handleManageRole(member._id, "add", "moderator")}
                        disabled={loading}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          opacity: loading ? 0.5 : 1,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="star" size={20} color="#3b82f6" />
                        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Make Moderator</Text>
                      </TouchableOpacity>
                    )}

                    {(isCreator || isAdmin) && role === "Moderator" && (
                      <TouchableOpacity
                        onPress={() => handleManageRole(member._id, "remove", "moderator")}
                        disabled={loading}
                        style={{
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          opacity: loading ? 0.5 : 1,
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close" size={20} color={colors.text} />
                        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>Remove Moderator</Text>
                      </TouchableOpacity>
                    )}

                    {canRemoveMembers && !isMemberCreator && (
                      <>
                        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 4 }} />
                        <TouchableOpacity
                          onPress={() => handleRemoveMember(member._id)}
                          disabled={loading}
                          style={{
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                            opacity: loading ? 0.5 : 1,
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="person-remove-outline" size={20} color="#ef4444" />
                          <Text style={{ fontSize: 15, fontWeight: "500", color: "#ef4444" }}>Remove Member</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                );
              })()}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

