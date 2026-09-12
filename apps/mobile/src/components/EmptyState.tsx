import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.illustrationSlot}><MaterialIcons name="explore" size={34} color={colors.textSecondary} /></View>
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
    width: 72,
    height: 72,
    borderRadius: radii.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.bodyLg,
    fontFamily: 'DMSans_700Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
