import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../theme';

interface FadeSlideInProps extends PropsWithChildren {
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

export default function FadeSlideIn({ children, delay = 0, distance = 16, style }: FadeSlideInProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : distance);

  useEffect(() => {
    if (reducedMotion) return;

    const config = { duration: motion.duration.base, easing: Easing.bezier(...motion.easing.decelerate) };
    opacity.value = withDelay(delay, withTiming(1, config));
    translateY.value = withDelay(delay, withTiming(0, config));
  }, [delay, opacity, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
