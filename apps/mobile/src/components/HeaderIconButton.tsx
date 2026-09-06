import { Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface HeaderIconButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  testID?: string;
}

export default function HeaderIconButton({ icon, onPress, testID }: HeaderIconButtonProps) {
  return (
    <Pressable testID={testID} onPress={onPress} hitSlop={8} style={styles.button}>
      <MaterialIcons name={icon} size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: spacing.xs,
  },
});
