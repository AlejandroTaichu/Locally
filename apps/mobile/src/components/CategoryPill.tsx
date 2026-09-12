import { Pressable, StyleSheet, Text } from "react-native";
import { colors, typography } from "../theme";

interface CategoryPillProps {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export default function CategoryPill({
  label,
  emoji,
  selected,
  onPress,
  testID,
}: CategoryPillProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.pill, selected && styles.pillSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {emoji} {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  text: {
    ...typography.bodyMd,
    color: colors.textMuted,
  },
  textSelected: {
    color: colors.onPrimary,
    fontFamily: "DMSans_700Bold",
    fontWeight: "700",
  },
});
