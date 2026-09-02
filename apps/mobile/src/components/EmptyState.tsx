import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Illustration slot — matches OnboardingCard's placeholder until brand colors are finalized. */}
      <View style={styles.illustrationSlot} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  illustrationSlot: {
    width: 120,
    height: 120,
    borderRadius: radii.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyLg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
