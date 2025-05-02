import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const COLORS = {
  primary: '#E63946',
  secondary: '#1a1a1a',
  danger: '#ff3b3b',
  disabled: '#333',
  text: '#fff',
};

const Button = ({ label, onPress, variant = 'primary', disabled = false, loading = false, style }) => {
  const backgroundColor = disabled ? COLORS.disabled : COLORS[variant] || COLORS.primary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.text} />
      ) : (
        <Text style={[styles.text, { color: COLORS.text }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  text: {
    fontWeight: '600',
    fontSize: 15,
  },
});

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default Button;
