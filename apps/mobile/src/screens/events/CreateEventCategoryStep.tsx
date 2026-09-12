import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "../../components/Button";
import {
  CATEGORY_EMOJI,
  EVENT_CATEGORIES,
} from "../../constants/eventCategories";
import { colors, spacing, typography } from "../../theme";
import { stepStyles } from "./createEventStepStyles";

interface CreateEventCategoryStepProps {
  category: string | null;
  onSave: (category: string) => void;
  onCancel: () => void;
  bottomInset: number;
}

export default function CreateEventCategoryStep({
  category,
  onSave,
  onCancel,
  bottomInset,
}: CreateEventCategoryStepProps) {
  const [selected, setSelected] = useState(category);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={stepStyles.stepTitle}>Planın hangi{"\n"}tarafta?</Text>
        <Text style={stepStyles.stepSubtitle}>
          Doğru kategori, aynı heyecanı paylaşan insanları buluşturur.
        </Text>
        <View style={styles.grid}>
          {EVENT_CATEGORIES.map((option) => (
            <Pressable
              key={option}
              testID={`category-card-${option}`}
              accessibilityRole="radio"
              accessibilityLabel={option}
              accessibilityState={{ checked: selected === option }}
              style={[
                styles.category,
                selected === option && styles.categorySelected,
              ]}
              onPress={() => setSelected(option)}
            >
              <View style={styles.categoryTop}>
                <Text style={styles.emoji}>{CATEGORY_EMOJI[option]}</Text>
                {selected === option ? (
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={colors.onPrimary}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  selected === option && styles.categoryLabelSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View
        style={[styles.footer, { paddingBottom: bottomInset + spacing.sm }]}
      >
        <Button
          testID="category-save-button"
          title="Bu kategoriyi seç"
          onPress={() => selected && onSave(selected)}
          disabled={!selected}
        />
        <Pressable
          accessibilityRole="button"
          testID="category-cancel-button"
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelLink}>Vazgeç</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  category: {
    width: "48%",
    flexGrow: 1,
    borderRadius: 20,
    padding: 16,
    minHeight: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  categorySelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emoji: { fontSize: 27 },
  categoryLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  categoryLabelSelected: { color: colors.onPrimary },
  cancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  cancelLink: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "600",
    fontFamily: "DMSans_600SemiBold",
  },
});
