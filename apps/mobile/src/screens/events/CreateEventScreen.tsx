import { useState } from 'react';
import { Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { createEvent } from '../../api/events';
import type { JoinType } from '../../api/events';
import { ApiError } from '../../api/client';
import { getCurrentLocation } from '../../location/current-location';
import type { CurrentLocation } from '../../location/current-location';

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

      <TextInput style={styles.input} placeholder="Başlık (örn. 2'ye 2 Basketbol)" value={title} onChangeText={setTitle} />

      <TextInput style={styles.input} placeholder="Kategori" value={category} onChangeText={setCategory} />
      <View style={styles.chipRow}>
        {CATEGORY_SUGGESTIONS.map((suggestion) => (
          <Text
            key={suggestion}
            testID={`category-chip-${suggestion}`}
            style={styles.chip}
            onPress={() => setCategory(suggestion)}
          >
            {suggestion}
          </Text>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Konum açıklaması (örn. Moda Sahili Basketbol Sahası)"
        value={locationLabel}
        onChangeText={setLocationLabel}
      />
      <Button
        testID="use-current-location-button"
        title={isLocating ? 'Konum alınıyor...' : location ? 'Konum eklendi ✓' : 'Konumumu Kullan'}
        onPress={handleUseCurrentLocation}
        disabled={isLocating}
      />
      {location?.isFallback ? <Text style={styles.hint}>Konum izni alınamadı, Moda varsayılan olarak kullanıldı</Text> : null}

      <View style={styles.row}>
        <Button title={`Tarih: ${date.toLocaleDateString('tr-TR')}`} onPress={() => setShowDatePicker(true)} />
        <Button title={`Saat: ${time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`} onPress={() => setShowTimePicker(true)} />
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
        keyboardType="number-pad"
        value={capacity}
        onChangeText={setCapacity}
      />

      <View style={styles.row}>
        <Button
          testID="join-type-instant-button"
          title={joinType === 'instant' ? 'Direkt Katılım ✓' : 'Direkt Katılım'}
          onPress={() => setJoinType('instant')}
        />
        <Button
          testID="join-type-approval-button"
          title={joinType === 'approval' ? 'Onaylı Katılım ✓' : 'Onaylı Katılım'}
          onPress={() => setJoinType('approval')}
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
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#eef2ff',
    color: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 13,
  },
  hint: {
    fontSize: 12,
    color: '#999',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  error: {
    color: '#c0392b',
  },
});
