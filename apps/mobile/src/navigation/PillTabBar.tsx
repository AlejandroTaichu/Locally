import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, radii, shadows, spacing } from '../theme';

export const TAB_BAR_HEIGHT = 72;

export default function PillTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.container, { bottom: insets.bottom + spacing.sm }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        function onPress() {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable
            key={route.key}
            testID={options.tabBarButtonTestID}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={typeof options.title === 'string' ? options.title : route.name}
            onPress={onPress}
            style={styles.tab}
            hitSlop={8}
          >
            <View style={[styles.iconWrapper, isFocused && styles.iconWrapperActive]}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.onPrimary : colors.textMuted,
                size: 24,
              })}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    ...shadows.wide,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: radii.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: colors.textPrimary,
  },
});
