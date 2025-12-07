import React from "react";
import { View, Text, ScrollView, Linking, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "@env";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const InfoCard = ({ title, icon, children }) => (
  <View className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
    <View className="flex-row items-center gap-3 mb-3">
      <View className="p-2 bg-blue-100 rounded-lg">
        <Ionicons name={icon} size={20} color="#3b82f6" />
      </View>
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow = ({ icon, label, value, isLink = false }) => (
  <View className="flex-row items-start gap-3 mb-2">
    <Ionicons name={icon} size={20} color="#9ca3af" />
    <View className="flex-1">
      <Text className="text-sm text-gray-500">{label}</Text>
      {isLink ? (
        <Text
          className="text-blue-600"
          onPress={() => Linking.openURL(value.startsWith("http") ? value : `https://${value}`)}
        >
          {value}
        </Text>
      ) : (
        <Text className="text-gray-900">{value}</Text>
      )}
    </View>
  </View>
);

export default function AboutTab({ displayedUser }) {
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
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {displayedUser?.bio && (
          <InfoCard title="Bio" icon="heart">
            <Text className="text-gray-700 leading-relaxed">{displayedUser.bio}</Text>
          </InfoCard>
        )}

        {hasBasicInfo && (
          <InfoCard title="Thông tin liên hệ" icon="mail">
            {displayedUser.email && (
              <InfoRow icon="mail" label="Email" value={displayedUser.email} />
            )}
            {displayedUser.phoneNumber && (
              <InfoRow icon="call" label="Số điện thoại" value={displayedUser.phoneNumber} />
            )}
            {displayedUser.address && (
              <InfoRow icon="location" label="Địa chỉ" value={displayedUser.address} />
            )}
            {displayedUser.website && (
              <InfoRow
                icon="globe"
                label="Website"
                value={displayedUser.website}
                isLink
              />
            )}
          </InfoCard>
        )}

        {hasEducation && (
          <InfoCard title="Học vấn" icon="school">
            {displayedUser.education.school && (
              <Text className="font-semibold text-gray-900 mb-1">
                {displayedUser.education.school}
              </Text>
            )}
            {displayedUser.education.major && (
              <Text className="text-gray-600 mb-1">
                Chuyên ngành: {displayedUser.education.major}
              </Text>
            )}
            {displayedUser.education.year && (
              <Text className="text-gray-500 text-sm">{displayedUser.education.year}</Text>
            )}
          </InfoCard>
        )}

        {hasWork && (
          <InfoCard title="Công việc" icon="briefcase">
            {displayedUser.work.position && (
              <Text className="font-semibold text-gray-900 mb-1">
                {displayedUser.work.position}
              </Text>
            )}
            {displayedUser.work.company && (
              <Text className="text-gray-600 mb-1">
                tại {displayedUser.work.company}
              </Text>
            )}
            {displayedUser.work.duration && (
              <Text className="text-gray-500 text-sm">{displayedUser.work.duration}</Text>
            )}
          </InfoCard>
        )}

        {hasSkills && (
          <InfoCard title="Kỹ năng" icon="bulb">
            <View className="flex-row flex-wrap gap-2">
              {displayedUser.skills.map((skill, index) => (
                <View
                  key={index}
                  className="px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100"
                >
                  <Text className="text-blue-700 text-sm font-medium">{skill}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        )}

        {hasInterests && (
          <InfoCard title="Sở thích" icon="heart">
            <View className="flex-row flex-wrap gap-2">
              {displayedUser.interests.map((interest, index) => (
                <View
                  key={index}
                  className="px-3 py-1.5 bg-purple-50 rounded-full border border-purple-100"
                >
                  <Text className="text-purple-700 text-sm font-medium">{interest}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        )}

        {hasSocialLinks && (
          <InfoCard title="Liên kết xã hội" icon="share-social">
            <View className="gap-2">
              {displayedUser.socialLinks.map((social, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  onPress={() =>
                    Linking.openURL(
                      social.url.startsWith("http") ? social.url : `https://${social.url}`
                    )
                  }
                >
                  <Ionicons name="link" size={20} color="#3b82f6" />
                  <View className="flex-1">
                    <Text className="font-medium text-gray-900">{social.platform}</Text>
                    <Text className="text-sm text-gray-500 truncate">{social.url}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </InfoCard>
        )}

        {hasFriends && (
          <InfoCard title="Bạn bè" icon="people">
            <Text className="text-2xl font-bold text-blue-600 mb-4">
              {displayedUser.friends.length} bạn bè
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
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
                <Ionicons name="information-circle-outline" size={48} color="#9ca3af" />
              </View>
              <Text className="text-xl font-semibold text-gray-900 mb-2">
                Chưa có thông tin
              </Text>
              <Text className="text-gray-500 text-center">
                Người dùng này chưa thêm thông tin vào profile
              </Text>
            </View>
          )}
      </View>
    </ScrollView>
  );
}

