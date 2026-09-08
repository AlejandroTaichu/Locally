import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface OtpCodeInputProps {
  length?: number;
  value: string;
  onChangeText: (value: string) => void;
  testID?: string;
}

export default function OtpCodeInput({ length = 6, value, onChangeText, testID }: OtpCodeInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const char = value[index] ?? '';
        const isActive = focused && index === value.length;

        return (
          <View key={index} style={[styles.box, (isActive || char) && styles.boxFilled]}>
            <Text style={styles.boxText}>{char}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        testID={testID}
        style={styles.hiddenInput}
        caretHidden
        value={value}
        onChangeText={(text) => onChangeText(text.replace(/[^0-9]/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  box: {
    width: 46,
    height: 56,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  boxFilled: {
    borderColor: colors.primary,
  },
  boxText: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
});
