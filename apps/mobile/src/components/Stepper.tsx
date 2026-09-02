import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  testID?: string;
}

export default function Stepper({ value, onChange, min = 1, max = 500, step = 1, testID }: StepperProps) {
  function clamp(next: number): number {
    return Math.min(max, Math.max(min, next));
  }

  const isAtMin = value <= min;
  const isAtMax = value >= max;

  return (
    <View testID={testID} style={styles.container}>
      <Pressable
        accessibilityLabel="Azalt"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={isAtMin}
        onPress={() => onChange(clamp(value - step))}
        style={({ pressed }) => [styles.button, isAtMin && styles.buttonDisabled, pressed && !isAtMin && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>−</Text>
      </Pressable>

      <Text style={styles.value}>{value}</Text>

      <Pressable
        accessibilityLabel="Arttır"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        disabled={isAtMax}
        onPress={() => onChange(clamp(value + step))}
        style={({ pressed }) => [styles.button, isAtMax && styles.buttonDisabled, pressed && !isAtMax && styles.pressed]}
      >
        <Text style={styles.buttonLabel}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  value: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },
});
