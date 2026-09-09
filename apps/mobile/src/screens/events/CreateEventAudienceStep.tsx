import { StyleSheet, Text, View } from 'react-native';
import Chip from '../../components/Chip';
import Stepper from '../../components/Stepper';
import type { GenderRestriction } from '../../api/events';
import { spacing } from '../../theme';
import { stepStyles } from './createEventStepStyles';

const GENDER_OPTIONS: { value: GenderRestriction; label: string }[] = [
  { value: 'all', label: 'Herkes' },
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
];

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
      <Text style={stepStyles.stepTitle}>Kimler Katılabilir</Text>
      <Text style={stepStyles.stepSubtitle}>Cinsiyet ve yaş kısıtlarını belirle</Text>

      <Text style={stepStyles.fieldLabel}>Cinsiyet</Text>
      <View style={styles.chipRow}>
        {GENDER_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            testID={`gender-chip-${option.value}`}
            label={option.label}
            selected={genderRestriction === option.value}
            onPress={() => onGenderRestrictionChange(option.value)}
          />
        ))}
      </View>

      <View style={styles.ageRangeRow}>
        <View style={styles.ageField}>
          <Text style={stepStyles.fieldLabel}>Min Yaş</Text>
          <Stepper testID="min-age-stepper" value={minAge} onChange={onMinAgeChange} min={minAgeLimit} max={maxAgeLimit} />
        </View>
        <View style={styles.ageField}>
          <Text style={stepStyles.fieldLabel}>Max Yaş</Text>
          <Stepper testID="max-age-stepper" value={maxAge} onChange={onMaxAgeChange} min={minAgeLimit} max={maxAgeLimit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  ageRangeRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  ageField: {
    gap: spacing.xs,
  },
});
