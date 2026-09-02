import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { updateMe } from '../../api/users';
import Button from '../../components/Button';
import OnboardingCard from './OnboardingCard';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Onboarding'>;

const CARDS = [
  {
    title: 'Yakınındaki etkinlikleri keşfet',
    body: 'Çevrendeki basketbol, koşu, halısaha ve daha fazla etkinliği haritada gör.',
  },
  {
    title: 'Anında katıl ya da onay bekle',
    body: 'Bazı etkinliklere tek dokunuşla katıl, bazılarında organizatörün onayını bekle.',
  },
  {
    title: 'Kendi etkinliğini oluştur',
    body: 'Sen de bir etkinlik planla ve çevrendekileri davet et.',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { token, refreshUser } = useAuth();
  const [index, setIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const isLastCard = index === CARDS.length - 1;

  async function finishOnboarding() {
    if (!token || isFinishing) return;
    setIsFinishing(true);
    try {
      await updateMe({ onboardingCompleted: true }, token);
      await refreshUser();
      navigation.replace('EventList');
    } finally {
      setIsFinishing(false);
    }
  }

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  }

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        {!isLastCard ? (
          <Text testID="onboarding-skip" style={styles.skipLink} onPress={finishOnboarding}>
            Atla
          </Text>
        ) : null}
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pager}
      >
        {CARDS.map((card) => (
          <View key={card.title} style={{ width }}>
            <OnboardingCard title={card.title} body={card.body} />
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {CARDS.map((card, i) => (
          <View key={card.title} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        {isLastCard ? (
          <Button
            testID="onboarding-finish"
            title={isFinishing ? '...' : 'Başla'}
            onPress={finishOnboarding}
            disabled={isFinishing}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipRow: {
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  skipLink: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pager: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
  footer: {
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    justifyContent: 'center',
  },
});
