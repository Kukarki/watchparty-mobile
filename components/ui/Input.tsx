import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  secureToggle?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export function Input({
  label,
  error,
  secureToggle,
  leftIcon,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [hidden, setHidden] = useState(secureTextEntry ?? false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={COLORS.muted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.muted}
          selectionColor={COLORS.primary}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {secureToggle && (
          <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.eyeBtn}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: COLORS.cardElevated,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputNormal: { borderColor: COLORS.border },
  inputError: { borderColor: COLORS.danger },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    paddingVertical: 12,
  },
  leftIcon: { marginRight: 10 },
  eyeBtn: { padding: 4 },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 2,
  },
});
