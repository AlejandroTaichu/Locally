import { StyleSheet, Switch, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../theme";

interface ToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
  disabled?: boolean;
  showDivider?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export default function ToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  testID,
  disabled,
  showDivider = true,
  icon,
}: ToggleRowProps) {
  return (
    <View style={[styles.row, showDivider && styles.rowDivider]}>
      {icon ? (
        <View style={styles.iconBadge}>
          <MaterialIcons name={icon} size={20} color={colors.textSecondary} />
        </View>
      ) : null}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        testID={testID}
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    minHeight: 72,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});
