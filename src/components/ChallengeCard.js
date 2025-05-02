import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import TierBadge from './TierBadge';

const placeholderImage = 'https://via.placeholder.com/150'; // 🛡️ Fallback image (if needed)

const ChallengeCard = ({ challenge, onEnter, onView, progress = {} }) => {
  const { title, status, xpReward, requiredTier, image } = challenge;

  const getStatusColor = () => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#43AA8B';
      case 'expired':
        return '#999';
      case 'upcoming':
        return '#FFD166';
      default:
        return '#ccc';
    }
  };

  const isCompleted = progress?.completed;
  const isInProgress = progress?.inProgress;

  return (
    <View style={styles.card}>
      {/* 🖼️ Optional challenge image */}
      {image && (
        <Image
          source={{ uri: image || placeholderImage }}
          style={styles.challengeImage}
          accessibilityLabel="Challenge image"
        />
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {requiredTier && <TierBadge tier={requiredTier} />}
      </View>

      <Text style={[styles.status, { color: getStatusColor() }]}>{status}</Text>
      <Text style={styles.reward}>+{xpReward} XP</Text>

      {isCompleted ? (
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={onView}
          accessibilityRole="button"
          accessibilityLabel="View completed challenge"
        >
          <Text style={styles.viewText}>Completed</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.button}
          onPress={onEnter}
          accessibilityRole="button"
          accessibilityLabel={isInProgress ? 'Resume challenge' : 'Enter challenge'}
        >
          <Text style={styles.buttonText}>
            {isInProgress ? 'Resume Challenge' : 'Enter Challenge'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

ChallengeCard.propTypes = {
  challenge: PropTypes.shape({
    title: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    xpReward: PropTypes.number.isRequired,
    requiredTier: PropTypes.string,
    image: PropTypes.string,
  }).isRequired,
  onEnter: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  progress: PropTypes.shape({
    completed: PropTypes.bool,
    inProgress: PropTypes.bool,
  }),
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  challengeImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    paddingRight: 10,
  },
  status: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  reward: {
    color: '#ccc',
    marginTop: 6,
    fontSize: 13,
  },
  button: {
    backgroundColor: '#E63946',
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  viewBtn: {
    backgroundColor: '#2a2a2a',
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewText: {
    color: '#aaa',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ChallengeCard;
