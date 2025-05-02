import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../context/UserContext';
import { useTierAccess } from '../hooks/useTierAccess';
import { uploadFile } from '../utils/fileUploader';
import { saveNewUserPlan } from '../services/userPlanService';
import analyzeProgressPhotos from '../functions/analyzeProgress';
import i18n from '../locales/i18n';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';

const views = ['Front', 'Side', 'Back'];

const VisualGainsScreen = () => {
  const { userProfile, userId } = useContext(UserContext);
  const { locked } = useTierAccess('Pro');

  const [beforeImg, setBeforeImg] = useState(null);
  const [afterImg, setAfterImg] = useState(null);
  const [view, setView] = useState('Front');
  const [isPublic, setIsPublic] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const pickImage = async (setter) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setErrorText('');
        setter(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Image picker error:', err.message);
      setErrorText(i18n.t('visual.errorUpload') || 'Image upload failed.');
    }
  };

  const handleAnalyze = async () => {
    if (!beforeImg || !afterImg) {
      setErrorText(i18n.t('visual.missingPhotos') || 'Select before and after photos.');
      return;
    }

    setLoading(true);
    setErrorText('');
    setFeedback('');

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No auth token available');

      const beforeUpload = await uploadFile({
        uri: beforeImg,
        type: 'image',
        userId: userProfile.id,
        endpoint: `${process.env.EXPO_PUBLIC_API_BASE_URL}/upload/photo`,
        token,
      });

      const afterUpload = await uploadFile({
        uri: afterImg,
        type: 'image',
        userId: userProfile.id,
        endpoint: `${process.env.EXPO_PUBLIC_API_BASE_URL}/upload/photo`,
        token,
      });

      if (!beforeUpload?.url || !afterUpload?.url) {
        throw new Error('Image upload failed.');
      }

      const result = await analyzeProgressPhotos({
        weekStart: 'Week 1',
        weekEnd: 'Week 6',
        view,
        userGoal: userProfile.goal,
        before: beforeUpload.url,
        after: afterUpload.url,
        token,
      });

      if (result?.summary) {
        setFeedback(result.summary);
      } else {
        setFeedback(i18n.t('visual.noFeedback') || 'No feedback generated.');
      }

      await saveNewUserPlan({
        userId,
        name: `Visual Gains - ${view} View`,
        type: 'Progress',
        exercises: [
          { day: 'Before Photo', workout: beforeUpload.url },
          { day: 'After Photo', workout: afterUpload.url },
          { day: 'Feedback', workout: result?.summary || 'No feedback available' },
        ],
        createdAt: new Date().toISOString(),
        isPublic,
      });

      Alert.alert(i18n.t('visual.successTitle') || 'Success!', i18n.t('visual.successMessage') || 'Progress saved!');

    } catch (error) {
      console.error('AI Analysis error:', error.message);
      setErrorText(i18n.t('visual.errorFallback') || 'AI analysis failed. Progress photos saved without feedback.');

      // ⛑ Fallback: Save progress anyway, even if AI fails
      try {
        const beforeFallback = await uploadFile({
          uri: beforeImg,
          type: 'image',
          userId: userProfile.id,
          endpoint: `${process.env.EXPO_PUBLIC_API_BASE_URL}/upload/photo`,
          token: await AsyncStorage.getItem('authToken'),
        });

        const afterFallback = await uploadFile({
          uri: afterImg,
          type: 'image',
          userId: userProfile.id,
          endpoint: `${process.env.EXPO_PUBLIC_API_BASE_URL}/upload/photo`,
          token: await AsyncStorage.getItem('authToken'),
        });

        await saveNewUserPlan({
          userId,
          name: `Visual Gains - ${view} View`,
          type: 'Progress',
          exercises: [
            { day: 'Before Photo', workout: beforeFallback.url },
            { day: 'After Photo', workout: afterFallback.url },
            { day: 'Feedback', workout: 'AI feedback unavailable.' },
          ],
          createdAt: new Date().toISOString(),
          isPublic,
        });

        Alert.alert('Saved!', 'Photos saved successfully, but no AI feedback available.');
      } catch (fallbackErr) {
        console.error('Fallback save failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  if (locked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.lockedText}>
          {i18n.t('visual.locked') || 'Upgrade required to access Visual Gains.'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{i18n.t('visual.title') || 'Visual Gains'}</Text>

      {/* View Selector */}
      <View style={styles.viewRow}>
        {views.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.viewBtn, view === v && styles.viewBtnActive]}
            onPress={() => setView(v)}
            accessibilityRole="button"
            accessibilityLabel={`${i18n.t('visual.selectView')}: ${v}`}
          >
            <Text style={view === v ? styles.viewTextActive : styles.viewText}>
              {i18n.t(`visual.${v.toLowerCase()}`) || v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Image Upload */}
      <View style={styles.imageRow}>
        <TouchableOpacity
          onPress={() => pickImage(setBeforeImg)}
          style={styles.imageBox}
          accessibilityRole="imagebutton"
          accessibilityLabel={i18n.t('visual.uploadBefore')}
        >
          {beforeImg ? (
            <Image source={{ uri: beforeImg }} style={styles.image} />
          ) : (
            <Text style={styles.imageText}>{i18n.t('visual.before')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => pickImage(setAfterImg)}
          style={styles.imageBox}
          accessibilityRole="imagebutton"
          accessibilityLabel={i18n.t('visual.uploadAfter')}
        >
          {afterImg ? (
            <Image source={{ uri: afterImg }} style={styles.image} />
          ) : (
            <Text style={styles.imageText}>{i18n.t('visual.after')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {errorText !== '' && <Text style={styles.errorText}>{errorText}</Text>}

      {/* Analyze Button */}
      {beforeImg && afterImg && (
        <TouchableOpacity style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading}>
          <Text style={styles.analyzeText}>
            {loading ? i18n.t('common.loading') : i18n.t('visual.analyze')}
          </Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />}

      {/* AI Feedback Result */}
      {feedback && (
        <View style={styles.resultBlock}>
          <Text style={styles.resultTitle}>{i18n.t('visual.feedback')}</Text>
          <Text style={styles.resultText}>{feedback}</Text>
        </View>
      )}

      {/* Public Switch */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{i18n.t('visual.makePublic')}</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: '#777', true: colors.success }}
          thumbColor={isPublic ? colors.primary : '#ccc'}
        />
      </View>
    </ScrollView>
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
  viewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  viewBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  viewBtnActive: {
    backgroundColor: colors.primary,
  },
  viewText: {
    color: colors.textSecondary,
  },
  viewTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  imageBox: {
    backgroundColor: colors.surface,
    width: '48%',
    aspectRatio: 3 / 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 13,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  analyzeBtn: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    marginTop: spacing.sm,
  },
  analyzeText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultBlock: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 10,
    marginTop: spacing.md,
  },
  resultTitle: {
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
  },
  errorText: {
    color: colors.error || '#E63946',
    textAlign: 'center',
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  toggleLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  lockedText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default VisualGainsScreen;
