import React, { useEffect, useState, useContext } from "react";
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
import { useTierAccess } from "../hooks/useTierAccess";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const DEFAULT_AVATAR = "https://default-avatar.repz.app/img.png";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { userId } = useContext(UserContext);
  const { userToken } = useContext(AuthContext);
  const { tier, allowed } = useTierAccess("Free");
  const { toggleTheme } = useTheme();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadProfile = async () => {
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
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleViewProof = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      setErrorMsg(i18n.t("errors.linkOpenFail"));
    });
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
        <Text style={styles.errorText}>{errorMsg || i18n.t("errors.profileMissing")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={{ uri: profile.profilePicture || profile.avatar || DEFAULT_AVATAR }}
          style={styles.avatar}
          accessibilityLabel="User avatar"
        />
        <Text style={styles.name}>{profile.username}</Text>
        <Text style={styles.sub}>{profile.gym} • {profile.goal}</Text>
        <Text style={styles.meta}>XP: {profile.xp || 0} • Streak: {profile.streak || 0} {i18n.t("profile.days")}</Text>
        <Text style={styles.meta}>{i18n.t("profile.tier")}: {tier}</Text>

        <TouchableOpacity onPress={toggleTheme} style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.accentBlue, fontWeight: "bold" }}>
            {i18n.t("profile.toggleTheme")}
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>{i18n.t("profile.follow")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>{i18n.t("profile.message")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>{i18n.t("profile.requestSpot")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t("profile.bestLifts")}</Text>
        {(profile.bestLifts || []).length === 0 ? (
          <Text style={styles.meta}>{i18n.t("profile.noLifts")}</Text>
        ) : (
          profile.bestLifts.map((lift) => (
            <View key={lift.type} style={styles.liftRow}>
              <Text style={styles.liftText}>{lift.type}: {lift.value}</Text>
              {lift.proof && (
                <TouchableOpacity onPress={() => handleViewProof(lift.proof)}>
                  <Text style={styles.link}>{i18n.t("profile.viewProof")}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t("profile.transformation")}</Text>
        {profile.transformations?.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {profile.transformations.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={styles.progressImg}
                accessibilityLabel={`Transformation image ${idx + 1}`}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.meta}>{i18n.t("profile.noTransformation")}</Text>
        )}
      </View>

      {profile.isCreator && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("profile.creatorDashboard")}</Text>
          <Text style={styles.meta}>{i18n.t("profile.plansSold")}: {profile.creatorStats?.sold || 0}</Text>
          <Text style={styles.meta}>{i18n.t("profile.earnings")}: £{profile.creatorStats?.earnings || 0}</Text>
          <Text style={styles.meta}>{i18n.t("profile.topPlan")}: {profile.creatorStats?.topPlan || "N/A"}</Text>
          <TouchableOpacity
            style={styles.earningsBtn}
            onPress={() => navigation.navigate("UserPlans")}
          >
            <Text style={styles.earningsText}>{i18n.t("profile.viewPlans")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {allowed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t("profile.myTools")}</Text>
          <View style={styles.toolsRow}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => navigation.navigate("PlanBuilder")}
            >
              <Text style={styles.toolText}>{i18n.t("profile.toolPlanBuilder")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => navigation.navigate("VisualGains")}
            >
              <Text style={styles.toolText}>{i18n.t("profile.toolVisualGains")}</Text>
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
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 15,
    textAlign: "center",
    padding: spacing.md,
  },
  topSection: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.heading3,
    color: colors.textPrimary,
    textAlign: "center",
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    marginVertical: 4,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  liftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  liftText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  link: {
    color: colors.accentBlue,
    fontWeight: "bold",
    fontSize: 13,
  },
  progressImg: {
    width: 120,
    height: 140,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  earningsBtn: {
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
  },
  earningsText: {
    color: "#fff",
    fontWeight: "bold",
  },
  toolsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  toolBtn: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  toolText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
});

export default React.memo(ProfileScreen);
