import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { getChallenges, submitChallenge } from '../api/challengeApi';
import ChallengeCard from '../components/ChallengeCard';
import { useTierAccess } from '../hooks/useTierAccess';
import i18n from '../locales/i18n';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';

const PAGE_SIZE = 10;

const ChallengeScreen = () => {
  const [challenges, setChallenges] = useState([]);
  const [displayedChallenges, setDisplayedChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [submittedId, setSubmittedId] = useState(null);
  const [page, setPage] = useState(1);
  const { locked } = useTierAccess('Free');

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getChallenges();
      setChallenges(data);
      setDisplayedChallenges(data.slice(0, PAGE_SIZE));
    } catch (err) {
      console.error(err);
      setError(i18n.t('challenge.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = async (challengeId) => {
    try {
      await submitChallenge(challengeId);
      setSubmittedId(challengeId);
    } catch (err) {
      console.error(err);
      setError(i18n.t('challenge.submitFail'));
    }
  };

  const handleLoadMore = () => {
    if (loading || refreshing) return;
    const nextPage = page + 1;
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    if (start >= challenges.length) return;
    setDisplayedChallenges((prev) => [...prev, ...challenges.slice(start, end)]);
    setPage(nextPage);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadChallenges().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    loadChallenges();
  }, []);

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>{i18n.t('challenge.locked')}</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <ChallengeCard
      challenge={item}
      progress={item.progress || {}}
      onEnter={() => handleEnter(item.id)}
      onView={() => setSubmittedId(item.id)}
    />
  );

  const screenHeight = Dimensions.get('window').height;

  return (
    <View style={[styles.container, { minHeight: screenHeight }]}>
      <Text style={styles.header}>{i18n.t('challenge.header')}</Text>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : loading && !refreshing ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : displayedChallenges.length === 0 ? (
        <Text style={styles.emptyText}>{i18n.t('challenge.noChallenges')}</Text>
      ) : (
        <FlatList
          data={displayedChallenges}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
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
  header: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  lockedText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ChallengeScreen;
