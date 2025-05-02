import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

const ExerciseCard = ({ exercise, onAdd }) => {
  const fallbackIcon = 'https://via.placeholder.com/40x40.png?text=EX';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onAdd}
      accessibilityRole="button"
      accessibilityLabel={`Add ${exercise.name}`}
      testID={`exercise-card-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Image
        source={{ uri: exercise.icon || fallbackIcon }}
        style={styles.icon}
      />
      <View style={styles.details}>
        <Text style={styles.name}>{exercise.name}</Text>
        <Text style={styles.meta}>
          {exercise.category} • {exercise.muscle}
        </Text>
      </View>
      <Text style={styles.add}>+</Text>
    </TouchableOpacity>
  );
};

ExerciseCard.propTypes = {
  exercise: PropTypes.shape({
    name: PropTypes.string.isRequired,
    icon: PropTypes.string,
    category: PropTypes.string.isRequired,
    muscle: PropTypes.string.isRequired,
  }).isRequired,
  onAdd: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
    minWidth: 200,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  meta: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  add: {
    color: '#E63946',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ExerciseCard;
