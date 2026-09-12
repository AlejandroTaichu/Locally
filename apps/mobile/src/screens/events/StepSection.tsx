import { StyleSheet, Text, View } from "react-native";
import type { PropsWithChildren } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../theme";

interface StepSectionProps extends PropsWithChildren {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  trailing?: string;
}

export default function StepSection({
  label,
  icon,
  trailing,
  children,
}: StepSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon ? (
            <MaterialIcons name={icon} size={18} color={colors.textSecondary} />
          ) : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  trailing: {
    ...typography.labelCaps,
    color: colors.primary,
    textTransform: "none",
    letterSpacing: 0,
  },
  content: {
    gap: spacing.sm,
  },
});
