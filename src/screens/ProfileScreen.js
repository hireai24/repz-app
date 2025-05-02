import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { getUserProfile } from '../api/userApi';
import { UserContext } from '../context/UserContext';
import { useTierAccess } from '../hooks/useTierAccess';
import { AuthContext } from '../context/AuthContext';
import i18n from '../locales/i18n';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';

const DEFAULT_AVATAR = 'https://default-avatar.repz.app/img.png';

const ProfileScreen = () => {
  const { userId } = useContext(UserContext);
  const { userToken } = useContext(AuthContext);
  const { tier, allowed } = useTierAccess('Free');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (!userId) throw new Error('User not found');
      const res = await getUserProfile(userId, userToken);
      if (res.success) {
        setProfile(res.user);
      } else {
        throw new Error(res.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setErrorMsg(i18n.t('errors.profileLoadMessage') || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (errorMsg || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg || i18n.t('errors.profileMissing')}</Text>
      </View>
    );
  }

  const handleViewProof = (url) => {
    if (!url) return;
    Linking.openURL(url).catch((err) =>
      Alert.alert('Error', i18n.t('errors.linkOpenFail') || 'Failed to open link')
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={{ uri: profile.profilePicture || profile.avatar || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile.username}</Text>
        <Text style={styles.sub}>{profile.gym} • {profile.goal}</Text>
        <Text style={styles.meta}>
          XP: {profile.xp || 0} • Streak: {profile.streak || 0} {i18n.t('profile.days')}
        </Text>
        <Text style={styles.meta}>
          {i18n.t('profile.tier')}: {tier}
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>{i18n.t('profile.follow')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>{i18n.t('profile.message')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>{i18n.t('profile.requestSpot')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Best Lifts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t('profile.bestLifts')}</Text>
        {(profile.bestLifts || []).length === 0 ? (
          <Text style={styles.meta}>{i18n.t('profile.noLifts')}</Text>
        ) : (
          profile.bestLifts.map((lift) => (
            <View key={lift.type} style={styles.liftRow}>
              <Text style={styles.liftText}>
                {lift.type}: {lift.value}
              </Text>
              {lift.proof && (
                <TouchableOpacity onPress={() => handleViewProof(lift.proof)}>
                  <Text style={styles.link}>{i18n.t('profile.viewProof')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </View>

      {/* Transformation Progress */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{i18n.t('profile.transformation')}</Text>
        {profile.transformations?.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {profile.transformations.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={styles.progressImg}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.meta}>{i18n.t('profile.noTransformation')}</Text>
        )}
      </View>

      {/* Creator Dashboard */}
      {profile.isCreator && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('profile.creatorDashboard')}</Text>
          <Text style={styles.meta}>
            {i18n.t('profile.plansSold')}: {profile.creatorStats?.sold || 0}
          </Text>
          <Text style={styles.meta}>
            {i18n.t('profile.earnings')}: £{profile.creatorStats?.earnings || 0}
          </Text>
          <Text style={styles.meta}>
            {i18n.t('profile.topPlan')}: {profile.creatorStats?.topPlan || 'N/A'}
          </Text>
          <TouchableOpacity
            style={styles.earningsBtn}
            onPress={() => navigation.navigate('UserPlans')}
          >
            <Text style={styles.earningsText}>{i18n.t('profile.viewPlans')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pro Tools */}
      {allowed && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.t('profile.myTools')}</Text>
          <View style={styles.toolsRow}>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => navigation.navigate('PlanBuilder')}
            >
              <Text style={styles.toolText}>{i18n.t('profile.toolPlanBuilder')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => navigation.navigate('VisualGains')}
            >
              <Text style={styles.toolText}>{i18n.t('profile.toolVisualGains')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  topSection: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 999,
    marginBottom: spacing.md,
  },
  name: {
    ...typography.heading3,
    color: colors.textPrimary,
  },
  sub: {
    color: colors.textSecondary,
    marginTop: 4,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: 10,
  },
  actionBtn: {
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading4,
    color: colors.accent,
    marginBottom: 10,
  },
  liftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liftText: {
    color: colors.textPrimary,
  },
  link: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  progressImg: {
    width: 100,
    height: 120,
    borderRadius: 10,
    marginRight: 10,
  },
  earningsBtn: {
    backgroundColor: colors.accent,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  earningsText: {
    color: '#000',
    fontWeight: 'bold',
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  toolBtn: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: 8,
  },
  toolText: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ProfileScreen;
