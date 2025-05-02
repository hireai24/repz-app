import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ NEW
import { UserContext } from '../context/UserContext';
import { fetchUserPlans, deleteUserPlan } from '../services/userPlanService';
import PlanCard from '../components/PlanCard';
import useFadeIn from '../animations/fadeIn';
import i18n from '../locales/i18n';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';

const OFFLINE_PLANS_KEY = 'repz_offline_user_plans'; // ✅ NEW constant

const UserPlansScreen = () => {
  const { userId } = useContext(UserContext);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useFadeIn(300);

  useEffect(() => {
    if (userId) {
      loadPlans();
    }
  }, [userId]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchUserPlans(userId);

      if (response.success && Array.isArray(response.plans)) {
        setPlans(response.plans);
        await AsyncStorage.setItem(OFFLINE_PLANS_KEY, JSON.stringify(response.plans)); // ✅ Save to cache
      } else {
        throw new Error(response.error || i18n.t('plans.errorLoading'));
      }
    } catch (err) {
      console.error('Load plans error:', err);

      try {
        const cachedPlans = await AsyncStorage.getItem(OFFLINE_PLANS_KEY);
        if (cachedPlans) {
          const parsed = JSON.parse(cachedPlans);
          setPlans(parsed);
          setError(i18n.t('plans.offlineMode') || 'Offline mode: showing cached plans.');
        } else {
          setError(i18n.t('plans.errorUnexpected') || 'Unexpected error loading plans.');
        }
      } catch (storageError) {
        console.error('Failed to load cached plans:', storageError);
        setError(i18n.t('plans.errorUnexpected') || 'Unexpected error loading plans.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPlans();
    setRefreshing(false);
  };

  const confirmDelete = (planId) => {
    Alert.alert(
      i18n.t('plans.deleteTitle') || 'Delete Plan',
      i18n.t('plans.deleteConfirm') || 'Are you sure you want to delete this plan?',
      [
        { text: i18n.t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: i18n.t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(planId),
        },
      ]
    );
  };

  const handleDelete = async (planId) => {
    try {
      const res = await deleteUserPlan(planId);
      if (res.success) {
        const updatedPlans = plans.filter((plan) => plan.id !== planId);
        setPlans(updatedPlans);
        await AsyncStorage.setItem(OFFLINE_PLANS_KEY, JSON.stringify(updatedPlans)); // ✅ Update cache after delete
      } else {
        Alert.alert(
          i18n.t('common.error'),
          res.error || i18n.t('plans.deleteFail') || 'Failed to delete plan.'
        );
      }
    } catch (err) {
      console.error('Delete plan error:', err);
      Alert.alert(
        i18n.t('common.error'),
        i18n.t('plans.deleteFail') || 'Something went wrong deleting the plan.'
      );
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;
    }

    if (error && plans.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadPlans} style={styles.retryBtn}>
            <Text style={styles.retryText}>{i18n.t('common.retry') || 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (plans.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {i18n.t('plans.empty') || 'No saved plans yet. Create or buy plans to see them here!'}
          </Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>{i18n.t('common.tryAgain') || 'Reload'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            buyerId={userId}
            creatorStripeAccountId={item.creatorStripeAccountId}
            onDelete={() => confirmDelete(item.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>{i18n.t('plans.title') || 'My Plans'}</Text>
        {renderContent()}
      </Animated.View>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error || '#FF6B6B',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UserPlansScreen;
