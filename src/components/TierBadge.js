import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

const TierBadge = ({ tier }) => {
  const badgeStyles = {
    Free: {
      backgroundColor: '#444',
      textColor: '#ccc',
    },
    Pro: {
      backgroundColor: '#43AA8B',
      textColor: '#000',
    },
    Elite: {
      backgroundColor: '#E63946',
      textColor: '#fff',
    },
  };

  const { backgroundColor, textColor } = badgeStyles[tier] || badgeStyles['Free'];

  return (
    <View
      style={[styles.badge, { backgroundColor }]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Tier: ${tier}`}
    >
      <Text style={[styles.text, { color: textColor }]}>
        {tier?.toUpperCase() || 'FREE'}
      </Text>
    </View>
  );
};

TierBadge.propTypes = {
  tier: PropTypes.oneOf(['Free', 'Pro', 'Elite']),
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginLeft: 10,
  },
  text: {
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
});

export default TierBadge;
