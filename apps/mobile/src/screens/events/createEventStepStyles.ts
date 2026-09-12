import { StyleSheet } from "react-native";
import { colors, spacing, typography } from "../../theme";

// CreateEventScreen'in her adım bileşeni (CreateEvent*Step.tsx) arasında paylaşılan stiller.
export const stepStyles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  stepTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -1.1,
    color: colors.textPrimary,
  },
  stepSubtitle: {
    ...typography.bodyMd,
    color: colors.textMuted,
    marginTop: -6,
    lineHeight: 23,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodyMd,
    fontFamily: "DMSans_600SemiBold",
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  input: {
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainer,
    color: colors.textPrimary,
    ...typography.bodyLg,
  },
  textarea: {
    minHeight: 108,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  hint: {
    ...typography.bodyMd,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    textTransform: "none",
    letterSpacing: 0,
  },
});
