// src/components/Button.js
import React from "react";
import PropTypes from "prop-types";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";
import LinearGradient from "react-native-linear-gradient"; // For gradients

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
  const variantColors = {
    primary: colors.primary,
    secondary: colors.accentBlue,
    danger: colors.danger,
  };

  const textColor = outline || glass
    ? variantColors[variant] || colors.primary
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
    // Glass style
    return (
      <TouchableOpacity
        style={[
          styles.button,
          styles.glassButton,
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        testID={`button-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }

  if (outline) {
    // Outline style
    return (
      <TouchableOpacity
        style={[
          styles.button,
          {
            borderWidth: 2,
            borderColor: variantColors[variant] || colors.primary,
            backgroundColor: "transparent",
          },
          style,
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        testID={`button-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }

  // Gradient or solid fill
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={`button-${label.toLowerCase().replace(/\s+/g, "-")}`}
      style={style}
    >
      <LinearGradient
        colors={[
          disabled
            ? colors.disabled
            : variant === "primary"
            ? colors.gradientStart
            : variant === "secondary"
            ? colors.accentBlue
            : colors.danger,
          disabled
            ? colors.disabled
            : variant === "primary"
            ? colors.gradientEnd
            : variant === "secondary"
            ? colors.neonBlue
            : colors.neonPink,
        ]}
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
    borderRadius: spacing.radiusPill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginVertical: spacing.xs,
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
});

export default Button;
