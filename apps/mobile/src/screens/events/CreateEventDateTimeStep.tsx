import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { stepStyles } from './createEventStepStyles';

interface CreateEventDateTimeStepProps {
  date: Date;
  onDateChange: (value: Date) => void;
  time: Date;
  onTimeChange: (value: Date) => void;
}

export default function CreateEventDateTimeStep({ date, onDateChange, time, onTimeChange }: CreateEventDateTimeStepProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Tarih & Saat</Text>
      <Text style={stepStyles.stepSubtitle}>Etkinliğin ne zaman başlayacağını seç</Text>

      <Text style={stepStyles.fieldLabel}>Tarih</Text>
      <Pressable testID="event-date-row" onPress={() => setShowDatePicker(true)} style={styles.row}>
        <Text style={styles.rowValue}>{date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
      </Pressable>

      <Text style={stepStyles.fieldLabel}>Saat</Text>
      <Pressable testID="event-time-row" onPress={() => setShowTimePicker(true)} style={styles.row}>
        <Text style={styles.rowValue}>{time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
        <MaterialIcons name="schedule" size={20} color={colors.textMuted} />
      </Pressable>

      {showDatePicker ? (
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) onDateChange(selected);
            }}
          />
        </View>
      ) : null}
      {showTimePicker ? (
        <View style={styles.pickerCard}>
          <DateTimePicker
            value={time}
            mode="time"
            onChange={(_, selected) => {
              setShowTimePicker(false);
              if (selected) onTimeChange(selected);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowValue: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  pickerCard: {
    padding: spacing.xs,
    alignItems: 'center',
  },
});
