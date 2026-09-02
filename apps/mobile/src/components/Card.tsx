import { Pressable, StyleSheet, View } from 'react-native';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { colors, radii, shadows } from '../theme';

interface CardProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

export default function Card({ children, style, onPress, testID }: CardProps) {
  if (onPress) {
    return (
      <Pressable testID={testID} onPress={onPress} style={({ pressed }) => [styles.base, pressed && styles.pressed, style]}>
        {children}
      </Pressable>
    );
  }

  return (
    <View testID={testID} style={[styles.base, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    // No `overflow: 'hidden'` here — boxShadow renders outside the element's
    // own box regardless of overflow, and none of today's usages need to
    // clip a child (e.g. an image) to the radius.
    ...shadows.card,
  },
  pressed: {
    opacity: 0.85,
  },
});
