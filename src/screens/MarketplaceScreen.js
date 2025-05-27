import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
} from "react-native";

import PlanCard from "../components/PlanCard";
import { fetchMarketplacePlans } from "../services/planService";
import { useTierAccess } from "../hooks/useTierAccess";
import { UserContext } from "../context/UserContext";
import i18n from "../locales/i18n";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

const filters = [
  "Fat Loss",
  "Strength",
  "Hypertrophy",
  "Athletic",
  "Meal",
  "Bundle",
];
const screenWidth = Dimensions.get("window").width;

const MarketplaceScreen = () => {
  const [selectedFilter, setSelectedFilter] = useState("Fat Loss");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { locked } = useTierAccess("Pro");
  const { userId } = useContext(UserContext);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setErrorText("");
      const response = await fetchMarketplacePlans(selectedFilter);
      if (response.success) {
        setPlans(response.plans || []);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } else {
        throw new Error(response.error || "Unknown error");
      }
    } catch {
      setPlans([]);
      setErrorText(i18n.t("marketplace.errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, fadeAnim]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t("marketplace.locked")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("marketplace.title")}</Text>

      <View style={styles.filtersRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              selectedFilter === f && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(f)}
            accessibilityRole="button"
            accessibilityLabel={`${i18n.t("marketplace.filters." + f.toLowerCase())} filter`}
          >
            <Text
              style={
                selectedFilter === f
                  ? styles.filterTextActive
                  : styles.filterText
              }
            >
              {i18n.t(`marketplace.filters.${f.toLowerCase()}`) || f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
      ) : errorText ? (
        <View style={styles.emptyState}>
          <Text style={styles.errorText}>{errorText}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPlans}>
            <Text style={styles.retryButtonText}>{i18n.t("common.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t("common.noData")}</Text>
          <Text style={styles.hintText}>{i18n.t("marketplace.hint")}</Text>
        </View>
      ) : (
        <Animated.View style={[styles.animatedList, { opacity: fadeAnim }]}>
          <FlatList
            data={plans}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PlanCard
                plan={item}
                buyerId={userId}
                creatorStripeAccountId={item.creatorStripeAccountId}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  animatedList: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 6,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    minWidth: screenWidth * 0.24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  filterTextActive: {
    color: colors.textPrimary,
    fontWeight: "bold",
  },
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: spacing.md,
  },
  hintText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  loadingIndicator: {
    marginTop: spacing.lg,
  },
  lockedContainer: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
});

export default MarketplaceScreen;
