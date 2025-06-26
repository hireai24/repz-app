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
  disabled: {
    opacity: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: 15,
    padding: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
});

export default Input;
