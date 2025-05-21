import React from "react";
import PropTypes from "prop-types";
import { TextInput, View, Text, StyleSheet } from "react-native";

import colors from "../theme/colors";
import spacing from "../theme/spacing";

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  editable = true,
  style,
  textContentType,
  autoCompleteType,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label} accessibilityRole="label">
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, !editable && styles.disabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        testID={`input-${label?.toLowerCase().replace(/\s+/g, "-")}`}
        textContentType={textContentType}
        autoComplete={autoCompleteType || "off"}
      />
    </View>
  );
};

Input.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  secureTextEntry: PropTypes.bool,
  keyboardType: PropTypes.string,
  editable: PropTypes.bool,
  style: PropTypes.object,
  textContentType: PropTypes.string,
  autoCompleteType: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    padding: spacing.sm,
    borderRadius: spacing.borderRadius,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Input;
