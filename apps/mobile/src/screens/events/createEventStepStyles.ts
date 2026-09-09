import { StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';

// CreateEventScreen'in her adım bileşeni (CreateEvent*Step.tsx) arasında paylaşılan stiller.
export const stepStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  stepTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  stepSubtitle: {
    ...typography.bodyMd,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.bodyLg,
  },
  textarea: {
    minHeight: 96,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  hint: {
    ...typography.labelCaps,
    color: colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
