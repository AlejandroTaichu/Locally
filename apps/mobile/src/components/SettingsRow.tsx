import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "../theme";

interface SettingsRowProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  testID?: string;
  showDivider?: boolean;
  tone?: "default" | "danger";
}

export default function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  testID,
  showDivider = true,
  tone = "default",
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.iconBadge}>
        <MaterialIcons
          name={icon}
          size={20}
          color={tone === "danger" ? colors.error : colors.textSecondary}
        />
      </View>
      <View style={styles.textContainer}>
        <Text
          style={[styles.title, tone === "danger" && { color: colors.error }]}
        >
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
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
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.6,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
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
