import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Stepper from "../../components/Stepper";
import type { JoinType } from "../../api/events";
import { colors, radii, spacing, typography } from "../../theme";
import { stepStyles } from "./createEventStepStyles";
import StepSection from "./StepSection";

interface CreateEventCapacityStepProps {
  capacityText: string;
  onCapacityTextChange: (value: string) => void;
  minCapacity: number;
  maxCapacity: number;
  joinType: JoinType;
  onJoinTypeChange: (value: JoinType) => void;
}

const JOIN_TYPE_OPTIONS: {
  value: JoinType;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  caption: string;
}[] = [
  {
    value: "instant",
    icon: "flash-on",
    title: "Direkt Katılım",
    caption: "Katılımcılar onay beklemeden doğrudan yer ayırtabilir.",
  },
  {
    value: "approval",
    icon: "verified-user",
    title: "Onaylı Katılım",
    caption: "Başvuranları sen incelersin, katılımı sen onaylarsın.",
  },
];

export default function CreateEventCapacityStep({
  capacityText,
  onCapacityTextChange,
  minCapacity,
  maxCapacity,
  joinType,
  onJoinTypeChange,
}: CreateEventCapacityStepProps) {
  const parsedCapacity = Number.parseInt(capacityText, 10);
  const capacity = Number.isFinite(parsedCapacity)
    ? Math.min(maxCapacity, Math.max(minCapacity, parsedCapacity))
    : minCapacity;

  function handleStepperChange(next: number) {
    onCapacityTextChange(String(next));
  }

  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Kaç kişilik{"\n"}bir plan?</Text>
      <Text style={stepStyles.stepSubtitle}>
        Küçük bir grup ya da kalabalık bir buluşma. Karar senin.
      </Text>

      <StepSection label="Kontenjan" icon="groups">
        <View style={styles.capacityRow}>
          <Text style={styles.capacityLabel}>KATILIMCI SAYISI</Text>
          <Stepper
            testID="capacity-input"
            value={capacity}
            onChange={handleStepperChange}
            min={minCapacity}
            max={maxCapacity}
          />
          <Text style={stepStyles.hint}>
            {minCapacity}–{maxCapacity} kişi arasında seçebilirsin.
          </Text>
        </View>
      </StepSection>

      <StepSection label="Katılım Tipi" icon="how-to-reg">
        {JOIN_TYPE_OPTIONS.map((option) => {
          const selected = joinType === option.value;
          return (
            <Pressable
              key={option.value}
              testID={`join-type-${option.value}-button`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onJoinTypeChange(option.value)}
              style={[styles.optionRow, selected && styles.optionRowSelected]}
            >
              <View
                style={[
                  styles.optionIcon,
                  selected && styles.optionIconSelected,
                ]}
              >
                <MaterialIcons
                  name={option.icon}
                  size={20}
                  color={selected ? colors.onPrimary : colors.textSecondary}
                />
              </View>
              <View style={styles.optionText}>
                <Text
                  style={[
                    styles.optionTitle,
                    selected && styles.optionTitleSelected,
                  ]}
                >
                  {option.title}
                </Text>
                <Text style={styles.optionCaption}>{option.caption}</Text>
              </View>
              <MaterialIcons
                name={selected ? "check-circle" : "radio-button-unchecked"}
                size={20}
                color={selected ? colors.textPrimary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </StepSection>
    </View>
  );
}

const styles = StyleSheet.create({
  capacityRow: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    gap: 20,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
  },
  capacityLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
  },
  optionRowSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.surfaceVariant,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.avatar,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: {
    backgroundColor: colors.textPrimary,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    ...typography.bodyLg,
    color: colors.textPrimary,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
  },
  optionTitleSelected: {
    color: colors.textPrimary,
  },
  optionCaption: {
    ...typography.bodyMd,
    color: colors.textMuted,
  },
});
