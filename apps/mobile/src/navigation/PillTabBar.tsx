import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, radii, shadows, spacing } from "../theme";

export const TAB_BAR_HEIGHT = 72;

export default function PillTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  return (
    <View style={[styles.container, { bottom: insets.bottom + spacing.sm }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable
            key={route.key}
            testID={options.tabBarButtonTestID}
            accessibilityRole="tab"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={
              typeof options.title === "string" ? options.title : route.name
            }
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({ type: "tabLongPress", target: route.key })
            }
            style={[styles.tab, isFocused && styles.tabActive]}
            hitSlop={8}
          >
            <View style={styles.iconWrapper}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.onPrimary : "#BCC1B8",
                size: 22,
              })}
            </View>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {options.title ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    backgroundColor: colors.textPrimary,
    borderRadius: radii.button,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    ...shadows.wide,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: radii.button,
    gap: 2,
  },
  tabActive: { backgroundColor: "#41483F" },
  label: { fontFamily: "DMSans_500Medium", fontSize: 10, color: "#BCC1B8" },
  labelActive: { color: colors.onPrimary },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: radii.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
});
