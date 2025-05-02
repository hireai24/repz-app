import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import ExerciseCard from '../components/ExerciseCard';
import { filterExercises, searchExercises } from '../utils/exerciseFilter';
import { getUserPlans } from '../api/marketplaceApi';
import useFadeIn from '../animations/fadeIn';
import { useTierAccess } from '../hooks/useTierAccess';
import { UserContext } from '../context/UserContext';
import exerciseData from '../data/exerciseDatabase.json';
import i18n from '../locales/i18n';
import spacing from '../theme/spacing';
import colors from '../theme/colors';
import typography from '../theme/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns'; // ✅ added for date formatting

const WorkoutLogScreen = () => {
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // ✅ new for date search
  const [workout, setWorkout] = useState([]);
  const [userPlans, setUserPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [errorLoadingPlans, setErrorLoadingPlans] = useState('');
  const fadeAnim = useFadeIn(150);
  const { allowed } = useTierAccess('Free');
  const { userId } = useContext(UserContext);

  const loadPlans = async () => {
    try {
      if (!userId) return;
      setLoadingPlans(true);
      setErrorLoadingPlans('');
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Missing auth token');
      const response = await getUserPlans(userId, token);
      if (response.success) {
        setUserPlans(response.plans || []);
      } else {
        setErrorLoadingPlans(response.error || i18n.t('errors.loadPlans'));
      }
    } catch (err) {
      console.error('Failed to load user plans:', err);
      setErrorLoadingPlans(i18n.t('errors.loadPlans'));
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [userId]);

  const addExercise = (exercise) => {
    setWorkout((prev) => [
      ...prev,
      {
        ...exercise,
        sets: [{ weight: '', reps: '', rpe: '', pr: false }],
        challengeEntry: false,
        video: null,
        date: format(new Date(), 'yyyy-MM-dd'), // ✅ added a date when adding an exercise
      },
    ]);
    Alert.alert(i18n.t('workout.addExercise'), `${exercise.name} ${i18n.t('common.confirm')}`);
  };

  const loadPlanToLog = (plan) => {
    const formatted = (plan.exercises || []).map((ex) => ({
      ...ex,
      sets: [{ weight: '', reps: '', rpe: '', pr: false }],
      challengeEntry: false,
      video: null,
      date: format(new Date(), 'yyyy-MM-dd'), // ✅ also add date when loading plan
    }));
    setWorkout(formatted);
  };

  const updateSet = (exerciseIndex, setIndex, field, value) => {
    const updated = [...workout];
    updated[exerciseIndex].sets[setIndex][field] = value;
    setWorkout(updated);
  };

  const addSet = (exerciseIndex) => {
    const updated = [...workout];
    updated[exerciseIndex].sets.push({ weight: '', reps: '', rpe: '', pr: false });
    setWorkout(updated);
  };

  const togglePR = (exerciseIndex, setIndex) => {
    const updated = [...workout];
    updated[exerciseIndex].sets[setIndex].pr = !updated[exerciseIndex].sets[setIndex].pr;
    setWorkout(updated);
  };

  const toggleChallenge = (exerciseIndex) => {
    const updated = [...workout];
    updated[exerciseIndex].challengeEntry = !updated[exerciseIndex].challengeEntry;
    setWorkout(updated);
  };

  const filtered = searchExercises(filterExercises(exerciseData, {}), search);

  const filteredWorkout = workout.filter((ex) => {
    if (!dateFilter) return true;
    return ex.date?.includes(dateFilter.trim());
  });

  if (!allowed) {
    return (
      <View style={styles.centered}>
        <Text style={styles.locked}>{i18n.t('workout.tierLock')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>
          {i18n.t('workoutLog.title') || i18n.t('dashboard.todayWorkout')}
        </Text>

        {/* Plan Loader */}
        {loadingPlans ? (
          <Text style={styles.loadingText}>{i18n.t('common.loading')}</Text>
        ) : errorLoadingPlans ? (
          <Text style={styles.errorText}>{errorLoadingPlans}</Text>
        ) : userPlans.length > 0 && (
          <View style={styles.planSelector}>
            <Text style={styles.sectionTitle}>
              {i18n.t('workoutLog.loadPlan') || 'Load Saved Plan'}
            </Text>
            <FlatList
              data={userPlans}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.planChip}
                  onPress={() => loadPlanToLog(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.planText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.sm }}
            />
          </View>
        )}

        {/* Exercise Search */}
        <TextInput
          style={styles.input}
          placeholder={i18n.t('workoutLog.addExercise')}
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />

        {/* Date Filter */}
        <TextInput
          style={styles.input}
          placeholder="Filter by date (yyyy-mm-dd)"
          placeholderTextColor={colors.textSecondary}
          value={dateFilter}
          onChangeText={setDateFilter}
        />

        <FlatList
          data={filtered}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard exercise={item} onAdd={() => addExercise(item)} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: spacing.md }}
        />
      </Animated.View>

      {/* Logged Exercises */}
      {filteredWorkout.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{i18n.t('common.noData')}</Text>
        </View>
      ) : (
        filteredWorkout.map((exercise, exIndex) => (
          <View key={exIndex} style={styles.exerciseBlock}>
            <Text style={styles.exerciseTitle}>{exercise.name}</Text>

            {exercise.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <TextInput
                  style={styles.setInput}
                  placeholder={i18n.t('workoutLog.weight')}
                  keyboardType="numeric"
                  value={set.weight}
                  onChangeText={(val) => updateSet(exIndex, setIndex, 'weight', val)}
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={styles.setInput}
                  placeholder={i18n.t('workoutLog.reps')}
                  keyboardType="numeric"
                  value={set.reps}
                  onChangeText={(val) => updateSet(exIndex, setIndex, 'reps', val)}
                  placeholderTextColor={colors.textSecondary}
                />
                <TextInput
                  style={styles.setInput}
                  placeholder={i18n.t('workoutLog.rpe')}
                  keyboardType="numeric"
                  value={set.rpe}
                  onChangeText={(val) => updateSet(exIndex, setIndex, 'rpe', val)}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity onPress={() => togglePR(exIndex, setIndex)}>
                  <Text style={[styles.prButton, set.pr && styles.prActive]}>PR</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIndex)}>
              <Text style={styles.addSetText}>+ {i18n.t('workoutLog.addSet')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.challengeToggle} onPress={() => toggleChallenge(exIndex)}>
              <Text style={{ color: exercise.challengeEntry ? colors.success : colors.textSecondary }}>
                {exercise.challengeEntry
                  ? i18n.t('workoutLog.markedChallenge')
                  : i18n.t('workoutLog.tagChallenge')}
              </Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    flex: 1,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  planSelector: {
    marginBottom: spacing.md,
  },
  planChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: 10,
  },
  planText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exerciseBlock: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  exerciseTitle: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setInput: {
    flex: 1,
    backgroundColor: colors.input,
    color: colors.textPrimary,
    padding: spacing.sm,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  prButton: {
    padding: spacing.sm,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  prActive: {
    color: colors.primary,
  },
  addSetBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
  },
  addSetText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  challengeToggle: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    marginBottom: spacing.md,
  },
  locked: {
    color: colors.textSecondary,
    padding: spacing.lg,
    fontSize: 16,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default WorkoutLogScreen;
