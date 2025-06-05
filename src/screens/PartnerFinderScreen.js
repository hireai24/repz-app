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
  const { currentGym, userProfile } = useContext(UserContext);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!currentGym) {
        setError(i18n.t("partnerFinder.selectGymPrompt"));
        setSlots([]);
        return;
      }
      if (!userProfile || !userProfile.uid) {
        setError(i18n.t("common.userNotAuthenticated"));
        setSlots([]);
        return;
      }
      const {
        success,
        data,
        error: apiError,
      } = await getPartnerSlots(currentGym);
      if (success) {
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
      setError(i18n.t("common.errorFetchingSlots"));
    } finally {
      setLoading(false);
    }
  }, [currentGym, userProfile]);

  useEffect(() => {
    if (userProfile && userProfile.uid && currentGym) {
      fetchSlots();
    } else {
      setLoading(false);
      setError(i18n.t("partnerFinder.noUserOrGymSelected"));
    }
  }, [fetchSlots, userProfile, currentGym]);

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
    setLoading(true);
    try {
      const { success, error: apiError } = await acceptPartnerInvite(
        slotId,
        userProfile.uid,
      );
      if (success) {
        await fetchSlots();
      } else {
        setError(apiError || i18n.t("common.errorAcceptingInvite"));
      }
    } catch (err) {
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
  emptyListText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: "center",
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
});

export default PartnerFinderScreen;
