// src/components/Button.js

import React from "react";
import PropTypes from "prop-types";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
} from "react-native";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import shadows from "../theme/shadows";
import LinearGradient from "react-native-linear-gradient";

/**
 * Button component with premium visual styles.
 * Supports: gradient, outline, glass variants.
 */
const Button = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  outline = false,
  glass = false,
}) => {
  const variantGradients = {
    primary: [colors.gradientStart, colors.gradientEnd],
    secondary: [colors.accentNeonBlue, colors.accentNeonPink],
    danger: [colors.neonPink, colors.neonPurple],
  };

  const variantColor = variantGradients[variant] || variantGradients.primary;
  const textColor =
    outline || glass
      ? variantGradients[variant]?.[0] || colors.primary
      : colors.textOnPrimary;

  const buttonContent = (
    <>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={textColor} />
        </View>
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </>
  );

  if (glass) {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          styles.glassButton,
          disabled && styles.disabledButton,
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }

  if (outline) {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          styles.outlineButton,
          {
            borderColor: variantColor[0],
          },
          disabled && styles.disabledButton,
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }

  // Gradient style
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[disabled && styles.disabledButton, style]}
    >
      <LinearGradient
        colors={disabled ? [colors.disabled, colors.disabled] : variantColor}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        {buttonContent}
      </LinearGradient>
    </TouchableOpacity>
  );
};

Button.propTypes = {
  label: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "danger"]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  outline: PropTypes.bool,
  glass: PropTypes.bool,
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: spacing.radiusFull,
    paddingHorizontal: spacing.spacing8,
    paddingVertical: spacing.spacing4,
    marginVertical: spacing.spacing2,
    ...shadows.shadow2,
  },
  label: {
    ...typography.button,
  },
  loadingWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  glassButton: {
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default Button;
