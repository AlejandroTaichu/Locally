import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import CategoryCard from '../../components/CategoryCard';
import Button from '../../components/Button';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON, EVENT_CATEGORIES } from '../../constants/eventCategories';
import { colors, spacing, typography } from '../../theme';
import { stepStyles } from './createEventStepStyles';

interface CreateEventCategoryStepProps {
  category: string | null;
  onSave: (category: string) => void;
  onCancel: () => void;
  bottomInset: number;
}

export default function CreateEventCategoryStep({ category, onSave, onCancel, bottomInset }: CreateEventCategoryStepProps) {
  const [selected, setSelected] = useState(category);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={stepStyles.stepTitle}>Kategori Seç</Text>
        <View style={styles.grid}>
          {EVENT_CATEGORIES.map((option) => (
            <CategoryCard
              key={option}
              testID={`category-card-${option}`}
              label={option}
              icon={CATEGORY_ICONS[option] ?? DEFAULT_CATEGORY_ICON}
              selected={selected === option}
              onPress={() => setSelected(option)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: bottomInset + spacing.sm }]}>
        <Button testID="category-save-button" title="Kaydet" onPress={() => selected && onSave(selected)} disabled={!selected} />
        <Text testID="category-cancel-button" style={styles.cancelLink} onPress={onCancel}>
          İptal
        </Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  cancelLink: {
    ...typography.bodyMd,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
});
