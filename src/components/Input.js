import React from 'react';
import PropTypes from 'prop-types';
import { TextInput, View, Text, StyleSheet } from 'react-native';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  style,
  textContentType,      // ✅ New prop
  autoCompleteType,     // ✅ New prop (note: used mostly for legacy Android, still good to include)
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text
          style={styles.label}
          accessibilityRole="label"
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, !editable && styles.disabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#555"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={label}
        testID={`input-${label?.toLowerCase().replace(/\s+/g, '-')}`}
        textContentType={textContentType}       // ✅ Passed into TextInput
        autoComplete={autoCompleteType || 'off'} // ✅ (modern replacement for autoCompleteType, React Native uses autoComplete now)
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
  textContentType: PropTypes.string,   // ✅ Added to propTypes
  autoCompleteType: PropTypes.string,  // ✅ Added to propTypes
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Input;
