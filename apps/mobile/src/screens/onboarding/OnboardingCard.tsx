import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

interface OnboardingCardProps {
  title: string;
  body: string;
}

export default function OnboardingCard({ title, body }: OnboardingCardProps) {
  return (
    <View style={styles.container}>
      {/* Illustration slot — swap for real artwork once brand colors are finalized. */}
      <View style={styles.illustrationSlot} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  illustrationSlot: {
    width: 200,
    height: 200,
    borderRadius: radii.card,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
