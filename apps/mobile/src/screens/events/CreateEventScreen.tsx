import { useState } from 'react';
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
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateEvent'>;

const CATEGORY_SUGGESTIONS = ['Koşu', 'Basketbol', 'Halısaha', 'Bisiklet', 'Masa Oyunu'];

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

export default function CreateEventScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [capacity, setCapacity] = useState('');
  const [joinType, setJoinType] = useState<JoinType>('instant');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

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
          category: category.trim(),
          locationLat: location.lat,
          locationLng: location.lng,
          locationLabel: locationLabel.trim(),
          startsAt: combineDateAndTime(date, time).toISOString(),
          capacity: capacity.trim() ? Number(capacity.trim()) : undefined,
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
          {CATEGORY_SUGGESTIONS.map((suggestion) => (
            <Text
              key={suggestion}
              testID={`category-chip-${suggestion}`}
              style={[styles.chip, category === suggestion && styles.chipSelected]}
              onPress={() => setCategory(suggestion)}
            >
              {suggestion}
            </Text>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Konum açıklaması (örn. Moda Sahili Basketbol Sahası)"
          placeholderTextColor={colors.textMuted}
          value={locationLabel}
          onChangeText={setLocationLabel}
        />
        <Button
          testID="use-current-location-button"
          variant={location ? 'primary' : 'outline'}
          title={isLocating ? 'Konum alınıyor...' : location ? 'Konum eklendi ✓' : 'Konumumu Kullan'}
          onPress={handleUseCurrentLocation}
          disabled={isLocating}
        />
        {location?.isFallback ? <Text style={styles.hint}>Konum izni alınamadı, Moda varsayılan olarak kullanıldı</Text> : null}

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
          <DateTimePicker
            value={date}
            mode="date"
            minimumDate={new Date()}
            onChange={(_, selected) => {
              setShowDatePicker(false);
              if (selected) setDate(selected);
            }}
          />
        ) : null}
        {showTimePicker ? (
          <DateTimePicker
            value={time}
            mode="time"
            onChange={(_, selected) => {
              setShowTimePicker(false);
              if (selected) setTime(selected);
            }}
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Kontenjan (opsiyonel)"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={capacity}
          onChangeText={setCapacity}
        />

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
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.chip,
    ...typography.bodyMd,
    overflow: 'hidden',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: colors.onPrimary,
    fontWeight: '700',
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
