import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";

import { UserContext } from "../context/UserContext";
import { getPartnerSlots, acceptPartnerInvite } from "../api/partnerApi";
import PartnerSlotCard from "../components/PartnerSlotCard";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const PartnerFinderScreen = () => {
  const { currentGym, userProfile } = useContext(UserContext); // ✅ Added userProfile
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError(""); // Clear previous errors
    try {
      if (!currentGym) {
        setError(i18n.t("partnerFinder.selectGymPrompt")); // Ensure this key exists in your i18n files
        setSlots([]);
        return;
      }
      if (!userProfile || !userProfile.uid) {
        setError(i18n.t("common.userNotAuthenticated")); // Ensure this key exists
        setSlots([]);
        return;
      }

      const { success, data, error: apiError } = await getPartnerSlots(currentGym);
      if (success) {
        // Filter out slots that the current user has already created or joined
        const filteredSlots = data.filter(
          (slot) =>
            slot.userId !== userProfile.uid &&
            !slot.participants.includes(userProfile.uid),
        );
        setSlots(filteredSlots);
      } else {
        setError(apiError || i18n.t("common.error"));
      }
    } catch (err) {
      console.error("Error in fetchSlots:", err);
      setError(i18n.t("common.errorFetchingSlots")); // Ensure this key exists
    } finally {
      setLoading(false);
    }
  }, [currentGym, userProfile]);

  useEffect(() => {
    // Only fetch if userProfile and currentGym are available
    if (userProfile && userProfile.uid && currentGym) {
      fetchSlots();
    } else {
      setLoading(false);
      setError(i18n.t("partnerFinder.noUserOrGymSelected")); // Add a new i18n key for this state
    }
  }, [fetchSlots, userProfile, currentGym]); // Add dependencies

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSlots();
    setRefreshing(false);
  };

  const handleAccept = async (slotId) => {
    if (!userProfile || !userProfile.uid) {
      setError(i18n.t("common.userNotAuthenticated"));
      return;
    }
    setLoading(true); // Indicate action is in progress
    try {
      const { success, error: apiError } = await acceptPartnerInvite(
        slotId,
        userProfile.uid,
      ); // ✅ Pass userId
      if (success) {
        await fetchSlots(); // Refresh the list to remove the joined slot
      } else {
        setError(apiError || i18n.t("common.errorAcceptingInvite")); // Ensure this key exists
      }
    } catch (err) {
      console.error("Error in handleAccept:", err);
      setError(i18n.t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const renderSlot = ({ item }) => (
    <PartnerSlotCard slot={item} onAccept={() => handleAccept(item.id)} />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("dashboard.toolPartnerFinder")}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : slots.length === 0 ? (
        <Text style={styles.emptyListText}>
          {i18n.t("partnerFinder.noSlotsAvailable")}
        </Text>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item.id}
          renderItem={renderSlot}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  error: {
    color: colors.error,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyListText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});

export default PartnerFinderScreen;