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
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { getUserProfile } from "../api/userApi";
import { UserContext } from "../context/UserContext";
import { useTierAccess } from "../hooks/useTierAccess";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // ✅ NEW

import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const DEFAULT_AVATAR = "https://default-avatar.repz.app/img.png";

const ProfileScreen = React.memo(() => {
  const navigation = useNavigation();
  const { userId } = useContext(UserContext);
  const { userToken } = useContext(AuthContext);
  const { tier, allowed } = useTierAccess("Free");
  const { toggleTheme } = useTheme(); // ✅ NEW

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
        throw new Error(res.error || "Failed to load profile");
      }
    } catch {
      setErrorMsg(
        i18n.t("errors.profileLoadMessage") || "Error loading profile",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleViewProof = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() =>
      Alert.alert(
        "Error",
        i18n.t("errors.linkOpenFail") || "Failed to open link",
      ),
    );
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
        <Text
          style={styles.errorText}
          accessibilityLabel="Profile load error message"
        >
          {errorMsg || i18n.t("errors.profileMissing")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={{
            uri: profile.profilePicture || profile.avatar || DEFAULT_AVATAR,
          }}
          style={styles.avatar}
          accessibilityLabel="User avatar"
        />
        <Text style={styles.name} accessibilityLabel="Username">
          {profile.username}
        </Text>
        <Text style={styles.sub}>
          {profile.gym} • {profile.goal}
        </Text>
        <Text style={styles.meta}>
          XP: {profile.xp || 0} • Streak: {profile.streak || 0}{" "}
          {i18n.t("profile.days")}
        </Text>
        <Text style={styles.meta}>
          {i18n.t("profile.tier")}: {tier}
        </Text>

        {/* ✅ Theme toggle button */}
        <TouchableOpacity onPress={toggleTheme} style={{ marginTop: spacing.sm }}>
          <Text style={{ color: colors.accentBlue, fontWeight: "bold" }}>
            {i18n.t("profile.toggleTheme") || "Switch Theme"}
          </Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Follow button">
            <Text style={styles.actionText}>{i18n.t("profile.follow")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Message button">
            <Text style={styles.actionText}>{i18n.t("profile.message")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} accessibilityLabel="Request spot button">
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
              <Text style={styles.liftText}>
                {lift.type}: {lift.value}
              </Text>
              {lift.proof && (
                <TouchableOpacity onPress={() => handleViewProof(lift.proof)} accessibilityLabel={`View proof for ${lift.type}`}>
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
            accessibilityLabel="View my plans"
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
              accessibilityLabel="Open Plan Builder"
            >
              <Text style={styles.toolText}>{i18n.t("profile.toolPlanBuilder")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => navigation.navigate("VisualGains")}
              accessibilityLabel="Open Visual Gains"
            >
              <Text style={styles.toolText}>{i18n.t("profile.toolVisualGains")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
});

export default ProfileScreen;
