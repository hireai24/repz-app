// src/screens/ProfileScreen.js

import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getUserProfile } from "../api/userApi";
import { UserContext } from "../context/UserContext";
import useTierAccess from "../hooks/useTierAccess";
import { AuthContext } from "../context/AuthContext";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import XPProgress from "../components/XPProgress";
import TierBadge from "../components/TierBadge";

const DEFAULT_AVATAR = "https://default-avatar.repz.app/img.png";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { userId } = useContext(UserContext);
  const { userToken } = useContext(AuthContext);
  const { tier, allowed } = useTierAccess("Free");

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      if (!userId) throw new Error("User not found");
      const res = await getUserProfile(userId, userToken);
      if (res.success) {
        setProfile(res.user);
      } else {
        throw new Error(res.error || i18n.t("errors.profileLoadMessage"));
      }
    } catch {
      setErrorMsg(i18n.t("errors.profileLoadMessage"));
    } finally {
      setLoading(false);
    }
  }, [userId, userToken]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleViewProof = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        setErrorMsg(i18n.t("errors.linkOpenFail"));
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorMsg || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {errorMsg || i18n.t("errors.profileMissing")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: profile.profilePicture || profile.avatar || DEFAULT_AVATAR,
            }}
            style={styles.avatar}
          />
          <TouchableOpacity
            style={styles.editIconWrapper}
            onPress={() => navigation.navigate("AvatarSelector")}
          >
            <Image
              source={require("../assets/icons/icon-edit.png")}
              style={styles.editIcon}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{profile.username}</Text>
        <TierBadge tier={tier} />
        <XPProgress
          xp={profile.xp || 0}
          level={profile.level || 1}
          xpToNext={profile.xpToNext || 100}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.meta}>
          {i18n.t("profile.streak")}: {profile.streak || 0}
        </Text>
        <Text style={styles.meta}>
          {i18n.t("profile.tier")}: {tier}
        </Text>
      </View>

      {/* Transformations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {i18n.t("profile.transformation")}
        </Text>
        {profile.transformations?.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {profile.transformations.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={styles.progressImg}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.meta}>{i18n.t("profile.noTransformation")}</Text>
        )}
      </View>

      {/* Best Lifts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t("profile.bestLifts")}</Text>
        {(profile.bestLifts || []).length === 0 ? (
          <Text style={styles.meta}>{i18n.t("profile.noLifts")}</Text>
        ) : (
          profile.bestLifts.map((lift) => (
            <View key={lift.type} style={styles.liftRow}>
              <Text style={styles.liftText}>
                {lift.type}: {lift.value}
              </Text>
              {lift.proof && (
                <TouchableOpacity onPress={() => handleViewProof(lift.proof)}>
                  <Text style={styles.link}>{i18n.t("profile.viewProof")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Creator Stats */}
      {profile.isCreator && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {i18n.t("profile.creatorDashboard")}
          </Text>
          <Text style={styles.meta}>
            {i18n.t("profile.plansSold")}: {profile.creatorStats?.sold || 0}
          </Text>
          <Text style={styles.meta}>
            {i18n.t("profile.earnings")}: £{profile.creatorStats?.earnings || 0}
          </Text>
          <Text style={styles.meta}>
            {i18n.t("profile.topPlan")}: {profile.creatorStats?.topPlan || "N/A"}
          </Text>
          <TouchableOpacity
            style={styles.earningsBtn}
            onPress={() => navigation.navigate("UserPlans")}
          >
            <Text style={styles.earningsText}>
              {i18n.t("profile.viewPlans")}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tools */}
      {allowed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("profile.myTools")}</Text>
          <View style={styles.toolsRow}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => navigation.navigate("PlanBuilder")}
            >
              <Text style={styles.toolText}>
                {i18n.t("profile.toolPlanBuilder")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => navigation.navigate("VisualGains")}
            >
              <Text style={styles.toolText}>
                {i18n.t("profile.toolVisualGains")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  editIconWrapper: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 4,
  },
  editIcon: {
    width: 24,
    height: 24,
  },
  name: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  progressImg: {
    width: 120,
    height: 140,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  liftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  liftText: {
    color: colors.textPrimary,
  },
  link: {
    color: colors.accentBlue,
    fontWeight: "bold",
  },
  earningsBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  earningsText: {
    color: colors.textOnPrimary,
    fontWeight: "bold",
  },
  toolsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  toolBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  toolText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  errorText: {
    color: colors.error,
    textAlign: "center",
  },
});

export default React.memo(ProfileScreen);
