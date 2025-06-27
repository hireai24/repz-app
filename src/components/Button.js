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

const Button = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}) => {
  const variantColors = {
    primary: colors.primary,
    secondary: colors.accent,
    danger: colors.error,
  };

  const backgroundColor = disabled
    ? colors.disabled
    : variantColors[variant] || colors.primary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
      testID={`button-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.textOnPrimary} />
        </View>
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
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
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: spacing.sm,
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    ...typography.buttonText,
    color: colors.textOnPrimary,
    fontWeight: "600",
  },
  loadingWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Button;
