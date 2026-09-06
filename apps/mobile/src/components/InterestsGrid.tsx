import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON, EVENT_CATEGORIES } from '../constants/eventCategories';
import { colors, radii, spacing, typography } from '../theme';

interface InterestsGridProps {
  selected: string[];
  onChange: (interests: string[]) => void;
  max?: number;
}

export default function InterestsGrid({ selected, onChange, max = 3 }: InterestsGridProps) {
  function toggle(category: string) {
    if (selected.includes(category)) {
      onChange(selected.filter((c) => c !== category));
    } else if (selected.length < max) {
      onChange([...selected, category]);
    }
  }

  return (
    <View style={styles.grid}>
      {EVENT_CATEGORIES.map((category) => {
        const isSelected = selected.includes(category);
        const isDisabled = !isSelected && selected.length >= max;
        const icon = CATEGORY_ICONS[category] ?? DEFAULT_CATEGORY_ICON;

        return (
          <Pressable
            key={category}
            testID={`interest-card-${category}`}
            onPress={() => toggle(category)}
            disabled={isDisabled}
            style={[styles.card, isSelected && styles.cardSelected, isDisabled && styles.cardDisabled]}
          >
            {isSelected ? (
              <View style={styles.checkBadge}>
                <MaterialIcons name="check" size={12} color={colors.onPrimary} />
              </View>
            ) : null}
            <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
              <MaterialIcons name={icon} size={28} color={isSelected ? colors.onPrimary : colors.primary} />
            </View>
            <Text style={styles.cardLabel}>{category}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  card: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  cardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  cardDisabled: {
    opacity: 0.4,
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radii.avatar,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: colors.primary,
  },
  cardLabel: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
