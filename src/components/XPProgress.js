import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityRole,
} from 'react-native';

import useBounceXP from '../animations/bounceXP';
import { useTier } from '../context/TierContext';
import i18n from '../locales/i18n';

const XPProgress = ({ xp, level, xpToNext }) => {
  const percent = Math.min((xp / xpToNext) * 100, 100);
  const { scale, triggerBounce } = useBounceXP();
  const { tier } = useTier();

  useEffect(() => {
    triggerBounce();
  }, [xp]);

  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <Text style={styles.levelText}>
        {i18n.t('dashboard.level')} {level} ({tier})
      </Text>

      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: `${percent}%`,
              transform: [{ scaleY: scale }],
            },
          ]}
        />
      </View>

      <Animated.Text
        style={[styles.xpText, { transform: [{ scale }] }]}
        accessibilityLabel={`XP progress: ${xp} out of ${xpToNext}`}
      >
        {xp} XP / {xpToNext}
      </Animated.Text>
    </View>
  );
};

XPProgress.propTypes = {
  xp: PropTypes.number.isRequired,
  level: PropTypes.number.isRequired,
  xpToNext: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  levelText: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 6,
    fontSize: 14,
  },
  barBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#E63946',
    borderRadius: 8,
  },
  xpText: {
    color: '#ccc',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'right',
  },
});

export default XPProgress;
