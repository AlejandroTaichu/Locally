import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { stepStyles } from './createEventStepStyles';

interface CreateEventBasicsStepProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  category: string | null;
  onOpenCategory: () => void;
}

export default function CreateEventBasicsStep({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  category,
  onOpenCategory,
}: CreateEventBasicsStepProps) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Temel Bilgiler</Text>
      <Text style={stepStyles.stepSubtitle}>Etkinliğinin başlığını ve açıklamasını gir</Text>

      <Text style={stepStyles.fieldLabel}>Başlık</Text>
      <TextInput
        testID="event-title-input"
        style={stepStyles.input}
        placeholder="Örn. 2'ye 2 Basketbol"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={onTitleChange}
      />

      <Text style={stepStyles.fieldLabel}>Açıklama</Text>
      <TextInput
        style={[stepStyles.input, stepStyles.textarea]}
        placeholder="Etkinlikle ilgili detaylar (opsiyonel)"
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        value={description}
        onChangeText={onDescriptionChange}
      />

      <Pressable testID="category-picker-row" onPress={onOpenCategory} style={styles.row}>
        <View style={styles.rowText}>
          <Text style={stepStyles.fieldLabel}>Kategori</Text>
          <Text style={category ? styles.rowValue : styles.rowPlaceholder}>{category ?? 'Kategori seç'}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
      </Pressable>
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
  rowText: {
    gap: 2,
  },
  rowValue: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  rowPlaceholder: {
    ...typography.bodyLg,
    color: colors.textMuted,
  },
});
