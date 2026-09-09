import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface CategoryPillProps {
  label: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export default function CategoryPill({ label, emoji, selected, onPress, testID }: CategoryPillProps) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.pill} hitSlop={4}>
      <Text style={[styles.text, selected && styles.textSelected]}>
        {emoji} {label}
      </Text>
      {selected ? <View style={styles.underline} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.bodyMd,
    color: colors.textMuted,
  },
  textSelected: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  underline: {
    marginTop: 4,
    height: 2,
    borderRadius: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
  },
});
