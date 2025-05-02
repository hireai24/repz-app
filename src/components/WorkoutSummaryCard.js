import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AccessibilityRole,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTier } from '../context/TierContext';
import { useNavigation } from '@react-navigation/native';
import useBounceXP from '../animations/bounceXP';

const WorkoutSummaryCard = ({
  volume,
  prCount,
  xpEarned,
  streakDays,
  planName,
  planId,
  onShare,
  onAdapt,
}) => {
  const { tier } = useTier();
  const navigation = useNavigation();
  const { scale, triggerBounce } = useBounceXP();

  useEffect(() => {
    if (xpEarned > 0) triggerBounce();
  }, [xpEarned, planId]);

  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.title}>Workout Complete</Text>

      {planName && (
        <View style={styles.row}>
          <Ionicons name="clipboard-outline" size={20} color="#F4A261" />
          <Text style={styles.label}>Plan:</Text>
          <Text style={styles.value}>{planName}</Text>
        </View>
      )}

      <View style={styles.row}>
        <Ionicons name="barbell-outline" size={20} color="#FFD166" />
        <Text style={styles.label}>Volume:</Text>
        <Text style={styles.value}>{volume.toLocaleString()} kg</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="flame-outline" size={20} color="#E63946" />
        <Text style={styles.label}>PRs Hit:</Text>
        <Text style={styles.value}>{prCount}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="flash-outline" size={20} color="#43AA8B" />
        <Text style={styles.label}>XP Earned:</Text>
        <Text style={[styles.value, { transform: [{ scale }] }]}>+{xpEarned}</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={20} color="#aaa" />
        <Text style={styles.label}>Streak:</Text>
        <Text style={styles.value}>{streakDays} days</Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#888" />
        <Text style={styles.label}>Tier:</Text>
        <Text style={styles.value}>{tier}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onShare || (() => navigation.navigate('FormGhost'))}
          style={styles.shareBtn}
          accessibilityRole="button"
          accessibilityLabel="Share your lift"
        >
          <Text style={styles.shareText}>Share Your Lift</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            onAdapt ? onAdapt(planId) : navigation.navigate('PlanBuilder', { adaptFrom: planId })
          }
          style={styles.adaptBtn}
          accessibilityRole="button"
          accessibilityLabel="Use AI to adapt your next workout"
        >
          <Text style={styles.adaptText}>Use AI to Adapt Next Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

WorkoutSummaryCard.propTypes = {
  volume: PropTypes.number.isRequired,
  prCount: PropTypes.number.isRequired,
  xpEarned: PropTypes.number.isRequired,
  streakDays: PropTypes.number.isRequired,
  planName: PropTypes.string,
  planId: PropTypes.string.isRequired,
  onShare: PropTypes.func,
  onAdapt: PropTypes.func,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#aaa',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  value: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  actions: {
    marginTop: 18,
    gap: 10,
  },
  shareBtn: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  adaptBtn: {
    backgroundColor: '#E63946',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adaptText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default WorkoutSummaryCard;
