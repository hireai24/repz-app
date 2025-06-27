// src/components/Input.js
import React from "react";
import PropTypes from "prop-types";
import { TextInput, View, Text, StyleSheet } from "react-native";
import colors from "../theme/colors";
import spacing from "../theme/spacing";
import typography from "../theme/typography";

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
      {label ? (
        <Text style={styles.label} accessibilityRole="label">
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
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
        accessibilityState={{ disabled: !editable }}
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
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  textContentType: PropTypes.string,
  autoCompleteType: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.sm,
    color: colors.textPrimary,
    fontSize: 15,
    padding: spacing.sm,
  },
  inputDisabled: {
    opacity: 0.6,
  },
});

export default Input;
