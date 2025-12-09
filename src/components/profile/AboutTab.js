import React from "react";
import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeSafe } from "../../utils/themeHelper";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const InfoCard = ({ title, icon, children, colors }) => (
  <View className="rounded-lg p-4 mb-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
    <View className="flex-row items-center gap-3 mb-3">
      <View className="p-2 rounded-lg" style={{ backgroundColor: colors.primary + '20' }}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text className="text-lg font-semibold" style={{ color: colors.text }}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({ icon, label, value, isLink = false, colors }) => (
  <View className="flex-row items-start gap-3 mb-2">
    <Ionicons name={icon} size={20} color={colors.textTertiary} />
    <View className="flex-1">
      <Text className="text-sm" style={{ color: colors.textSecondary }}>{label}</Text>
      {isLink ? (
        <Text
          style={{ color: colors.primary }}
          onPress={() => Linking.openURL(value.startsWith("http") ? value : `https://${value}`)}
        >
          {value}
        </Text>
      ) : (
        <Text style={{ color: colors.text }}>{value}</Text>
      )}
    </View>
  </View>
);

export default function AboutTab({ displayedUser }) {
  const { colors } = useThemeSafe();
  const hasBasicInfo =
    displayedUser?.email ||
    displayedUser?.phoneNumber ||
    displayedUser?.address ||
    displayedUser?.website;

  const hasEducation =
    displayedUser?.education?.school ||
    displayedUser?.education?.major ||
    displayedUser?.education?.year;

  const hasWork =
    displayedUser?.work?.company ||
    displayedUser?.work?.position ||
    displayedUser?.work?.duration;

  const hasSkills = displayedUser?.skills?.length > 0;
  const hasInterests = displayedUser?.interests?.length > 0;
  const hasSocialLinks = displayedUser?.socialLinks?.length > 0;
  const hasFriends = displayedUser?.friends?.length > 0;

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="p-4">
        {displayedUser?.bio && (
          <InfoCard title="Bio" icon="heart" colors={colors}>
            <Text className="leading-relaxed" style={{ color: colors.text }}>{displayedUser.bio}</Text>
          </InfoCard>
        )}

        {hasBasicInfo && (
          <InfoCard title="Contact information" icon="mail" colors={colors}>
            {displayedUser.email && (
              <InfoRow icon="mail" label="Email" value={displayedUser.email} colors={colors} />
            )}
            {displayedUser.phoneNumber && (
              <InfoRow icon="call" label="Phone number" value={displayedUser.phoneNumber} colors={colors} />
            )}
            {displayedUser.address && (
              <InfoRow icon="location" label="Address" value={displayedUser.address} colors={colors} />
            )}
            {displayedUser.website && (
              <InfoRow
                icon="globe"
                label="Website"
                value={displayedUser.website}
                isLink
                colors={colors}
              />
            )}
          </InfoCard>
        )}

        {hasEducation && (
          <InfoCard title="Education" icon="school" colors={colors}>
            {displayedUser.education.school && (
              <Text className="font-semibold mb-1" style={{ color: colors.text }}>
                {displayedUser.education.school}
              </Text>
            )}
            {displayedUser.education.major && (
              <Text className="mb-1" style={{ color: colors.textSecondary }}>
                Major: {displayedUser.education.major}
              </Text>
            )}
            {displayedUser.education.year && (
              <Text className="text-sm" style={{ color: colors.textTertiary }}>{displayedUser.education.year}</Text>
            )}
          </InfoCard>
        )}

        {hasWork && (
          <InfoCard title="Work" icon="briefcase" colors={colors}>
            {displayedUser.work.position && (
              <Text className="font-semibold mb-1" style={{ color: colors.text }}>
                {displayedUser.work.position}
              </Text>
            )}
            {displayedUser.work.company && (
              <Text className="mb-1" style={{ color: colors.textSecondary }}>
                at {displayedUser.work.company}
              </Text>
            )}
            {displayedUser.work.duration && (
              <Text className="text-sm" style={{ color: colors.textTertiary }}>{displayedUser.work.duration}</Text>
            )}
          </InfoCard>
        )}

        {hasSkills && (
          <InfoCard title="Skills" icon="bulb" colors={colors}>
            <View className="flex-row flex-wrap gap-2">
              {displayedUser.skills.map((skill, index) => (
                <View
                  key={index}
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: colors.primary + '20', borderWidth: 1, borderColor: colors.primary + '30' }}
                >
                  <Text className="text-sm font-medium" style={{ color: colors.primary }}>{skill}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        )}

        {hasInterests && (
          <InfoCard title="Interests" icon="heart" colors={colors}>
            <View className="flex-row flex-wrap gap-2">
              {displayedUser.interests.map((interest, index) => (
                <View
                  key={index}
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#9333EA20', borderWidth: 1, borderColor: '#9333EA30' }}
                >
                  <Text className="text-sm font-medium" style={{ color: '#9333EA' }}>{interest}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        )}

        {hasSocialLinks && (
          <InfoCard title="Social links" icon="share-social" colors={colors}>
            <View className="gap-2">
              {displayedUser.socialLinks.map((social, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: colors.surface }}
                  onPress={() =>
                    Linking.openURL(
                      social.url.startsWith("http") ? social.url : `https://${social.url}`
                    )
                  }
                >
                  <Ionicons name="link" size={20} color={colors.primary} />
                  <View className="flex-1">
                    <Text className="font-medium" style={{ color: colors.text }}>{social.platform}</Text>
                    <Text className="text-sm truncate" style={{ color: colors.textSecondary }}>{social.url}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </InfoCard>
        )}

        {hasFriends && (
          <InfoCard title="Friends" icon="people" colors={colors}>
            <Text className="text-2xl font-bold mb-4" style={{ color: colors.primary }}>
              {displayedUser.friends.length} friends
            </Text>
          </InfoCard>
        )}

        {!displayedUser?.bio &&
          !hasBasicInfo &&
          !hasEducation &&
          !hasWork &&
          !hasSkills &&
          !hasInterests &&
          !hasSocialLinks &&
          !hasFriends && (
            <View className="items-center py-20">
              <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: colors.surface }}>
                <Ionicons name="information-circle-outline" size={48} color={colors.textTertiary} />
              </View>
              <Text className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
                No information
              </Text>
              <Text className="text-center" style={{ color: colors.textSecondary }}>
                This user hasn't added any information to their profile
              </Text>
            </View>
          )}
      </View>
    </ScrollView>
  );
}

