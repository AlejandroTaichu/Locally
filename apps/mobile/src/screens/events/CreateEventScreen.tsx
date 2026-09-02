import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { createEvent } from '../../api/events';
import type { JoinType } from '../../api/events';
import { ApiError } from '../../api/client';
import { getCurrentLocation } from '../../location/current-location';
import type { CurrentLocation } from '../../location/current-location';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import Stepper from '../../components/Stepper';
import LocationMapPicker from '../../components/LocationMapPicker';
import { EVENT_CATEGORIES } from '../../constants/eventCategories';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateEvent'>;

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

export default function CreateEventScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [capacity, setCapacity] = useState(4);
  const [joinType, setJoinType] = useState<JoinType>('instant');
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

  function handleMapLocationChange(coordinate: { lat: number; lng: number }) {
    setLocation({ ...coordinate, isFallback: false });
  }

  async function handleSubmit() {
    setError(null);
    if (!title.trim() || !category.trim() || !locationLabel.trim()) {
      setError('Başlık, kategori ve konum açıklaması gerekli');
      return;
    }
    if (!location) {
      setError('Önce konumunu ekle');
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
          category: category.trim(),
          locationLat: location.lat,
          locationLng: location.lng,
          locationLabel: locationLabel.trim(),
          startsAt: combineDateAndTime(date, time).toISOString(),
          capacity,
          joinType,
        },
        token,
      );
      navigation.navigate('EventList');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Etkinlik Oluştur</Text>

        <Text style={styles.sectionLabel}>Temel Bilgiler</Text>
        <TextInput
          style={styles.input}
          placeholder="Başlık (örn. 2'ye 2 Basketbol)"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Kategori"
          placeholderTextColor={colors.textMuted}
          value={category}
          onChangeText={setCategory}
        />
        <View style={styles.chipRow}>
          {EVENT_CATEGORIES.map((suggestion) => (
            <Chip
              key={suggestion}
              testID={`category-chip-${suggestion}`}
              label={suggestion}
              selected={category === suggestion}
              onPress={() => setCategory(suggestion)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Açıklama (opsiyonel) — etkinlikle ilgili detaylar"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.sectionLabel}>Konum</Text>
        <TextInput
          style={styles.input}
          placeholder="Konum açıklaması (örn. Moda Sahili Basketbol Sahası)"
          placeholderTextColor={colors.textMuted}
          value={locationLabel}
          onChangeText={setLocationLabel}
        />
        <LocationMapPicker
          location={location}
          onLocationChange={handleMapLocationChange}
          onRecenter={handleUseCurrentLocation}
          isLocating={isLocating}
        />
        {location?.isFallback ? <Text style={styles.hint}>Konum izni alınamadı, Moda varsayılan olarak kullanıldı</Text> : null}

        <Text style={styles.sectionLabel}>Tarih & Saat</Text>
        <View style={styles.row}>
          <Button
            variant="outline"
            title={`Tarih: ${date.toLocaleDateString('tr-TR')}`}
            onPress={() => setShowDatePicker(true)}
            style={styles.flex}
          />
          <Button
            variant="outline"
            title={`Saat: ${time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
            onPress={() => setShowTimePicker(true)}
            style={styles.flex}
          />
        </View>
        {showDatePicker ? (
          <Card style={styles.pickerCard}>
            <DateTimePicker
              value={date}
              mode="date"
              minimumDate={new Date()}
              onChange={(_, selected) => {
                setShowDatePicker(false);
                if (selected) setDate(selected);
              }}
            />
          </Card>
        ) : null}
        {showTimePicker ? (
          <Card style={styles.pickerCard}>
            <DateTimePicker
              value={time}
              mode="time"
              onChange={(_, selected) => {
                setShowTimePicker(false);
                if (selected) setTime(selected);
              }}
            />
          </Card>
        ) : null}

        <Text style={styles.sectionLabel}>Kapasite & Katılım</Text>
        <Stepper testID="capacity-stepper" value={capacity} onChange={setCapacity} />

        <View style={styles.row}>
          <Button
            testID="join-type-instant-button"
            variant={joinType === 'instant' ? 'primary' : 'outline'}
            title={joinType === 'instant' ? 'Direkt Katılım ✓' : 'Direkt Katılım'}
            onPress={() => setJoinType('instant')}
            style={styles.flex}
          />
          <Button
            testID="join-type-approval-button"
            variant={joinType === 'approval' ? 'primary' : 'outline'}
            title={joinType === 'approval' ? 'Onaylı Katılım ✓' : 'Onaylı Katılım'}
            onPress={() => setJoinType('approval')}
            style={styles.flex}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          testID="create-event-submit-button"
          title={isSubmitting ? 'Oluşturuluyor...' : 'Etkinliği Oluştur'}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.bodyLg,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  descriptionInput: {
    minHeight: 96,
  },
  pickerCard: {
    padding: spacing.xs,
    alignItems: 'center',
  },
  hint: {
    ...typography.labelCaps,
    color: colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
