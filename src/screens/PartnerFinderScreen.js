// src/screens/PartnerFinderScreen.js

import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
      if (!userProfile?.uid) {
        setError(i18n.t("common.userNotAuthenticated"));
        setSlots([]);
        return;
      }

      const { success, data, error: apiError } = await getPartnerSlots(currentGym);

      if (success) {
        const filtered = data.filter(
          (slot) =>
            slot.userId !== userProfile.uid &&
            !slot.participants.includes(userProfile.uid)
        );
        setSlots(filtered);
      } else {
        setError(apiError || i18n.t("common.error"));
      }
    } catch {
      setError(i18n.t("common.errorFetchingSlots"));
    } finally {
      setLoading(false);
    }
  }, [currentGym, userProfile]);

  useEffect(() => {
    if (currentGym && userProfile?.uid) {
      fetchSlots();
    } else {
      setLoading(false);
      setError(i18n.t("partnerFinder.noUserOrGymSelected"));
    }
  }, [fetchSlots, currentGym, userProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSlots();
    setRefreshing(false);
  };

  const handleAccept = async (slotId) => {
    if (!userProfile?.uid) {
      setError(i18n.t("common.userNotAuthenticated"));
      return;
    }
    setLoading(true);
    try {
      const { success, error: apiError } = await acceptPartnerInvite(
        slotId,
        userProfile.uid
      );
      if (success) {
        await fetchSlots();
      } else {
        setError(apiError || i18n.t("common.errorAcceptingInvite"));
      }
    } catch {
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
      <View style={styles.headerRow}>
        <Text style={styles.title}>{i18n.t("dashboard.toolPartnerFinder")}</Text>
        <TouchableOpacity
          style={styles.searchBtn}
          accessibilityRole="button"
          onPress={() => {
            // Future: open filter/search modal
          }}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : slots.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t("partnerFinder.noSlotsAvailable")}</Text>
        </View>
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
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.sm,
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});

export default PartnerFinderScreen;
