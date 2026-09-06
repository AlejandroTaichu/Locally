import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { updateMe } from '../../api/users';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import ProfileStep from './ProfileStep';
import InterestsStep from './InterestsStep';
import LocationStep, { NEIGHBORHOODS } from './LocationStep';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Onboarding'>;

const STEP_LABELS = ['Profil', 'İlgi Alanları', 'Konum'];
const TOTAL_STEPS = STEP_LABELS.length;
const DEFAULT_AGE = 25;

export default function OnboardingScreen({ navigation }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const { token, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [age, setAge] = useState(DEFAULT_AGE);
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [homeLocation, setHomeLocation] = useState<{ lat: number; lng: number }>(NEIGHBORHOODS[0]);

  const isFirstStep = step === 1;
  const isLastStep = step === TOTAL_STEPS;
  const canContinue = step !== 2 || interests.length > 0;

  async function finishOnboarding() {
    if (!token || isFinishing) return;
    setError(null);
    setIsFinishing(true);
    try {
      await updateMe(
        {
          onboardingCompleted: true,
          age,
          interests,
          homeLocationLat: homeLocation.lat,
          homeLocationLng: homeLocation.lng,
          ...(bio.trim() ? { bio: bio.trim() } : {}),
          ...(username.trim() ? { username: username.trim() } : {}),
          ...(gender ? { gender } : {}),
        },
        token,
      );
      await refreshUser();
      navigation.replace('Tabs');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsFinishing(false);
    }
  }

  function handleNext() {
    if (isLastStep) {
      finishOnboarding();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (!isFirstStep) setStep((s) => s - 1);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: top + spacing.sm }]}>
        <View style={styles.headerRow}>
          {!isFirstStep ? (
            <Pressable testID="onboarding-back" onPress={handleBack} hitSlop={8}>
              <MaterialIcons name="arrow-back" size={22} color={colors.textSecondary} />
            </Pressable>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text style={styles.brandTitle}>Katıl</Text>
          {!isLastStep ? (
            <Text testID="onboarding-skip" style={styles.skipLink} onPress={finishOnboarding}>
              Atla
            </Text>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <View style={styles.stepLabelsRow}>
          {STEP_LABELS.map((label, index) => (
            <Text key={label} style={[styles.stepLabel, index + 1 <= step && styles.stepLabelActive]}>
              {label}
            </Text>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {step === 1 ? (
          <ProfileStep
            age={age}
            onAgeChange={setAge}
            bio={bio}
            onBioChange={setBio}
            username={username}
            onUsernameChange={setUsername}
            gender={gender}
            onGenderChange={setGender}
          />
        ) : null}
        {step === 2 ? <InterestsStep selected={interests} onChange={setInterests} /> : null}
        {step === 3 ? <LocationStep value={homeLocation} onChange={setHomeLocation} /> : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + spacing.sm }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          testID={isLastStep ? 'onboarding-finish' : 'onboarding-next'}
          title={isFinishing ? '...' : isLastStep ? 'Başla' : 'Devam Et'}
          onPress={handleNext}
          disabled={isFinishing || !canContinue}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 22,
  },
  brandTitle: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '800',
  },
  skipLink: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceVariant,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
