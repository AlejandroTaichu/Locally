import { StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../components/Button';
import type { JoinType } from '../../api/events';
import { colors, spacing } from '../../theme';
import { stepStyles } from './createEventStepStyles';

interface CreateEventCapacityStepProps {
  capacityText: string;
  onCapacityTextChange: (value: string) => void;
  minCapacity: number;
  maxCapacity: number;
  joinType: JoinType;
  onJoinTypeChange: (value: JoinType) => void;
}

export default function CreateEventCapacityStep({
  capacityText,
  onCapacityTextChange,
  minCapacity,
  maxCapacity,
  joinType,
  onJoinTypeChange,
}: CreateEventCapacityStepProps) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Kapasite & Katılım</Text>
      <Text style={stepStyles.stepSubtitle}>Kaç kişi katılabilir ve katılım nasıl onaylansın</Text>

      <Text style={stepStyles.fieldLabel}>Kontenjan</Text>
      <TextInput
        testID="capacity-input"
        style={stepStyles.input}
        placeholder={`${minCapacity}-${maxCapacity} arası`}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        value={capacityText}
        onChangeText={onCapacityTextChange}
      />

      <Text style={stepStyles.fieldLabel}>Katılım Tipi</Text>
      <View style={styles.row}>
        <Button
          testID="join-type-instant-button"
          variant={joinType === 'instant' ? 'primary' : 'outline'}
          title={joinType === 'instant' ? 'Direkt Katılım ✓' : 'Direkt Katılım'}
          onPress={() => onJoinTypeChange('instant')}
          style={styles.flex}
        />
        <Button
          testID="join-type-approval-button"
          variant={joinType === 'approval' ? 'primary' : 'outline'}
          title={joinType === 'approval' ? 'Onaylı Katılım ✓' : 'Onaylı Katılım'}
          onPress={() => onJoinTypeChange('approval')}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  flex: {
    flex: 1,
  },
});
