import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { GenderRestriction } from "../../api/events";
import { colors, spacing } from "../../theme";
import { stepStyles } from "./createEventStepStyles";
import StepSection from "./StepSection";

const GENDER_OPTIONS: { value: GenderRestriction; label: string }[] = [
  { value: "all", label: "Herkes" },
  { value: "female", label: "Kadın" },
  { value: "male", label: "Erkek" },
];

interface AgeInputProps {
  testID: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}

function AgeInput({ testID, value, onChange, min, max }: AgeInputProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  function handleChangeText(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 2);
    setDraft(digits);
    const parsed = Number(digits);
    if (digits && parsed >= min && parsed <= max) onChange(parsed);
  }

  function commit() {
    const parsed = Number(draft);
    const next = draft ? Math.min(max, Math.max(min, parsed)) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  }

  return (
    <TextInput
      testID={testID}
      accessibilityLabel={testID === "min-age-input" ? "Minimum yaş" : "Maksimum yaş"}
      style={styles.ageInput}
      value={draft}
      onChangeText={handleChangeText}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={2}
      selectTextOnFocus
    />
  );
}

interface CreateEventAudienceStepProps {
  genderRestriction: GenderRestriction;
  onGenderRestrictionChange: (value: GenderRestriction) => void;
  minAge: number;
  onMinAgeChange: (value: number) => void;
  maxAge: number;
  onMaxAgeChange: (value: number) => void;
  minAgeLimit: number;
  maxAgeLimit: number;
}

export default function CreateEventAudienceStep({
  genderRestriction,
  onGenderRestrictionChange,
  minAge,
  onMinAgeChange,
  maxAge,
  onMaxAgeChange,
  minAgeLimit,
  maxAgeLimit,
}: CreateEventAudienceStepProps) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Kimler{"\n"}bize katılsın?</Text>
      <Text style={stepStyles.stepSubtitle}>
        Son bir detay: buluşmanın katılım kriterlerini belirle.
      </Text>

      <StepSection label="Katılımcı Kriterleri" icon="groups">
        <Text style={stepStyles.fieldLabel}>Cinsiyet Kısıtı</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              testID={`gender-chip-${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{
                checked: genderRestriction === option.value,
              }}
              style={[
                styles.chip,
                genderRestriction === option.value && styles.chipSelected,
              ]}
              onPress={() => onGenderRestrictionChange(option.value)}
            >
              <Text
                style={[
                  styles.chipLabel,
                  genderRestriction === option.value &&
                    styles.chipLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </StepSection>
      <StepSection
        label="Yaş aralığı"
        icon="people-outline"
        trailing={`${minAge}–${maxAge} yaş`}
      >
        <View style={styles.ageRangeRow}>
          <View style={styles.ageField}>
            <Text style={stepStyles.fieldLabel}>En az</Text>
            <AgeInput
              testID="min-age-input"
              value={minAge}
              onChange={onMinAgeChange}
              min={minAgeLimit}
              max={maxAgeLimit}
            />
          </View>
          <View style={styles.ageField}>
            <Text style={stepStyles.fieldLabel}>En fazla</Text>
            <AgeInput
              testID="max-age-input"
              value={maxAge}
              onChange={onMaxAgeChange}
              min={minAgeLimit}
              max={maxAgeLimit}
            />
          </View>
        </View>
      </StepSection>
      <Text style={stepStyles.hint}>
        Özel bir tercihin yoksa “Herkes” seçimini ve geniş yaş aralığını
        koruyabilirsin.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 48,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  chipLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: colors.textSecondary,
  },
  chipLabelSelected: { color: colors.onPrimary },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  ageRangeRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  ageField: {
    flex: 1,
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  ageInput: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.md,
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: colors.textPrimary,
    textAlign: "center",
  },
});
