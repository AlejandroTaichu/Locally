import { StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors } from "../../theme";
import { stepStyles } from "./createEventStepStyles";
import StepSection from "./StepSection";

interface CreateEventDateTimeStepProps {
  date: Date;
  onDateChange: (value: Date) => void;
  time: Date;
  onTimeChange: (value: Date) => void;
}

export default function CreateEventDateTimeStep({
  date,
  onDateChange,
  time,
  onTimeChange,
}: CreateEventDateTimeStepProps) {
  return (
    <View testID="event-datetime-step" style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Takvimde{"\n"}yer açalım.</Text>
      <Text style={stepStyles.stepSubtitle}>
        Günü ve saati belirle, plan netleşsin.
      </Text>

      <StepSection
        label="Tarih"
        icon="calendar-today"
        trailing={date.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
        })}
      >
        <DateTimePicker
          value={date}
          mode="date"
          display="inline"
          minimumDate={new Date()}
          onValueChange={(_, selected) => {
            if (selected) onDateChange(selected);
          }}
          accentColor={colors.primary}
          themeVariant="light"
          locale="tr-TR"
          style={styles.calendar}
        />
      </StepSection>

      <StepSection
        label="Saat"
        icon="schedule"
        trailing={time.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      >
        <View style={styles.timeRow}>
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            themeVariant="light"
            locale="tr-TR"
            is24Hour
            textColor={colors.textPrimary}
            onValueChange={(_, selected) => {
              if (selected) onTimeChange(selected);
            }}
            style={styles.timePicker}
          />
        </View>
      </StepSection>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    height: 340,
  },
  timeRow: {
    alignItems: "center",
  },
  timePicker: {
    height: 140,
    width: "100%",
  },
});
