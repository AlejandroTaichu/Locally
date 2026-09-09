import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { createEvent } from '../../api/events';
import type { GenderRestriction, JoinType } from '../../api/events';
import { ApiError } from '../../api/client';
import { getCurrentLocation, geocodeAddress } from '../../location/current-location';
import type { CurrentLocation } from '../../location/current-location';
import Button from '../../components/Button';
import CreateEventBasicsStep from './CreateEventBasicsStep';
import CreateEventCategoryStep from './CreateEventCategoryStep';
import CreateEventLocationStep from './CreateEventLocationStep';
import CreateEventDateTimeStep from './CreateEventDateTimeStep';
import CreateEventCapacityStep from './CreateEventCapacityStep';
import CreateEventAudienceStep from './CreateEventAudienceStep';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateEvent'>;

const MIN_AGE = 13;
const MAX_AGE = 99;
const MIN_CAPACITY = 1;
const MAX_CAPACITY = 50;

type FlowStep = 'basics' | 'location' | 'datetime' | 'capacity' | 'audience';
type Step = FlowStep | 'category';

const FLOW: FlowStep[] = ['basics', 'location', 'datetime', 'capacity', 'audience'];
const STEP_TITLES: Record<FlowStep, string> = {
  basics: 'Temel Bilgiler',
  location: 'Konum',
  datetime: 'Tarih & Saat',
  capacity: 'Kapasite & Katılım',
  audience: 'Kimler Katılabilir',
};

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

export default function CreateEventScreen({ navigation }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const { token } = useAuth();
  const [step, setStep] = useState<Step>('basics');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [time, setTime] = useState(new Date());
  const [capacityText, setCapacityText] = useState('4');
  const [joinType, setJoinType] = useState<JoinType>('instant');
  const [genderRestriction, setGenderRestriction] = useState<GenderRestriction>('all');
  const [minAge, setMinAge] = useState(MIN_AGE);
  const [maxAge, setMaxAge] = useState(MAX_AGE);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLocating(true);
    getCurrentLocation()
      .then((current) => {
        if (!cancelled) setLocation(current);
      })
      .catch(() => {
        if (!cancelled) setError('Konum alınamadı');
      })
      .finally(() => {
        if (!cancelled) setIsLocating(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUseCurrentLocation() {
    Keyboard.dismiss();
    setIsLocating(true);
    setError(null);
    try {
      const current = await getCurrentLocation();
      setLocation(current);
    } catch {
      setError('Konum alınamadı');
    } finally {
      setIsLocating(false);
    }
  }

  async function handleSearchAddress() {
    if (!addressQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearchingAddress(true);
    setError(null);
    try {
      const found = await geocodeAddress(addressQuery.trim());
      if (found) {
        setLocation({ ...found, isFallback: false });
      } else {
        setError('Adres bulunamadı, haritadan dokunarak seçebilirsin');
      }
    } finally {
      setIsSearchingAddress(false);
    }
  }

  function handleMapLocationChange(coordinate: { lat: number; lng: number }) {
    setLocation({ ...coordinate, isFallback: false });
  }

  function handleMinAgeChange(next: number) {
    setMinAge(next);
    if (next > maxAge) setMaxAge(next);
  }

  function handleMaxAgeChange(next: number) {
    setMaxAge(next);
    if (next < minAge) setMinAge(next);
  }

  async function handleSubmit() {
    setError(null);
    if (!title.trim() || !category || !locationLabel.trim()) {
      setError('Başlık, kategori ve konum açıklaması gerekli');
      return;
    }
    if (!location) {
      setError('Önce konumunu ekle');
      return;
    }
    const capacity = Number.parseInt(capacityText, 10);
    if (!Number.isFinite(capacity) || capacity < MIN_CAPACITY || capacity > MAX_CAPACITY) {
      setError(`Kontenjan ${MIN_CAPACITY}-${MAX_CAPACITY} arasında olmalı`);
      return;
    }
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent(
        {
          title: title.trim(),
          description: description.trim() ? description.trim() : undefined,
          category,
          locationLat: location.lat,
          locationLng: location.lng,
          locationLabel: locationLabel.trim(),
          startsAt: combineDateAndTime(date, time).toISOString(),
          capacity,
          joinType,
          genderRestriction,
          minAge,
          maxAge,
        },
        token,
      );
      navigation.navigate('Tabs');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsSubmitting(false);
    }
  }

  const flowIndex = step === 'category' ? FLOW.indexOf('basics') : FLOW.indexOf(step);
  const isFirstStep = flowIndex === 0;
  const isLastStep = flowIndex === FLOW.length - 1;

  const canContinue =
    step === 'basics'
      ? title.trim().length > 0 && category != null
      : step === 'location'
        ? locationLabel.trim().length > 0 && location != null
        : step === 'capacity'
          ? (() => {
              const capacity = Number.parseInt(capacityText, 10);
              return Number.isFinite(capacity) && capacity >= MIN_CAPACITY && capacity <= MAX_CAPACITY;
            })()
          : true;

  function handleContinue() {
    setError(null);
    if (isLastStep) {
      handleSubmit();
      return;
    }
    const nextIndex = FLOW.indexOf(step as FlowStep) + 1;
    setStep(FLOW[nextIndex]);
  }

  function handleBack() {
    if (step === 'category') {
      setStep('basics');
      return;
    }
    if (isFirstStep) {
      navigation.goBack();
      return;
    }
    const prevIndex = FLOW.indexOf(step as FlowStep) - 1;
    setStep(FLOW[prevIndex]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable testID="create-event-back" onPress={handleBack} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.brandTitle}>Etkinlik Oluştur</Text>
          <View style={styles.headerSpacer} />
        </View>
        {step !== 'category' ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((flowIndex + 1) / FLOW.length) * 100}%` }]} />
          </View>
        ) : null}
      </View>

      {step === 'category' ? (
        <CreateEventCategoryStep
          category={category}
          onSave={(next) => {
            setCategory(next);
            setStep('basics');
          }}
          onCancel={() => setStep('basics')}
          bottomInset={bottom}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {step === 'basics' ? (
              <CreateEventBasicsStep
                title={title}
                onTitleChange={setTitle}
                description={description}
                onDescriptionChange={setDescription}
                category={category}
                onOpenCategory={() => setStep('category')}
              />
            ) : null}
            {step === 'location' ? (
              <CreateEventLocationStep
                locationLabel={locationLabel}
                onLocationLabelChange={setLocationLabel}
                addressQuery={addressQuery}
                onAddressQueryChange={setAddressQuery}
                onSearchAddress={handleSearchAddress}
                isSearchingAddress={isSearchingAddress}
                location={location}
                onLocationChange={handleMapLocationChange}
                onRecenter={handleUseCurrentLocation}
                isLocating={isLocating}
              />
            ) : null}
            {step === 'datetime' ? (
              <CreateEventDateTimeStep date={date} onDateChange={setDate} time={time} onTimeChange={setTime} />
            ) : null}
            {step === 'capacity' ? (
              <CreateEventCapacityStep
                capacityText={capacityText}
                onCapacityTextChange={setCapacityText}
                minCapacity={MIN_CAPACITY}
                maxCapacity={MAX_CAPACITY}
                joinType={joinType}
                onJoinTypeChange={setJoinType}
              />
            ) : null}
            {step === 'audience' ? (
              <CreateEventAudienceStep
                genderRestriction={genderRestriction}
                onGenderRestrictionChange={setGenderRestriction}
                minAge={minAge}
                onMinAgeChange={handleMinAgeChange}
                maxAge={maxAge}
                onMaxAgeChange={handleMaxAgeChange}
                minAgeLimit={MIN_AGE}
                maxAgeLimit={MAX_AGE}
              />
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: bottom + spacing.sm }]}>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              testID={isLastStep ? 'create-event-submit-button' : 'create-event-continue-button'}
              title={isSubmitting ? 'Oluşturuluyor...' : isLastStep ? 'Etkinliği Oluştur' : 'Devam Et'}
              onPress={handleContinue}
              disabled={isSubmitting || !canContinue}
            />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
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
    color: colors.textPrimary,
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
