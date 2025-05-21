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
  const { userProfile, currentGym } = useContext(UserContext);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const { success, data, error } = await getPartnerSlots(currentGym);
      if (success) {
        setSlots(data);
        setError("");
      } else {
        setError(error || i18n.t("common.error"));
      }
    } catch (err) {
      setError(i18n.t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [currentGym]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSlots();
    setRefreshing(false);
  };

  const handleAccept = async (slotId) => {
    try {
      const { success, error } = await acceptPartnerInvite(slotId);
      if (success) {
        fetchSlots();
      } else {
        setError(error || i18n.t("common.error"));
      }
    } catch {
      setError(i18n.t("common.error"));
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
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => item.id}
          renderItem={renderSlot}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: spacing.xl }}
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
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  error: {
    color: colors.error,
    textAlign: "center",
    marginTop: spacing.lg,
  },
});

export default PartnerFinderScreen;
