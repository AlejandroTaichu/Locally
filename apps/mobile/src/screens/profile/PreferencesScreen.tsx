import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { updateMe } from '../../api/users';
import { ApiError } from '../../api/client';
import { getCurrentLocation } from '../../location/current-location';
import type { CurrentLocation } from '../../location/current-location';
import Button from '../../components/Button';
import SettingsRow from '../../components/SettingsRow';
import LocationMapPicker from '../../components/LocationMapPicker';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Preferences'>;

export default function PreferencesScreen({ navigation }: Props) {
  const { user, token, refreshUser } = useAuth();
  const [location, setLocation] = useState<CurrentLocation | null>(
    user?.homeLocationLat != null && user?.homeLocationLng != null
      ? { lat: user.homeLocationLat, lng: user.homeLocationLng, isFallback: false }
      : null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location) return;
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
    // Sadece mount'ta çalışsın: `location` bilerek dependency'e eklenmedi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecenter() {
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

  async function handleSaveLocation() {
    if (!token || !location) return;
    setSaving(true);
    setError(null);
    try {
      await updateMe({ homeLocationLat: location.lat, homeLocationLng: location.lng }, token);
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SettingsRow
        testID="preferences-interests-row"
        icon="favorite-border"
        title="İlgi Alanları"
        subtitle={user.interests.length > 0 ? user.interests.join(', ') : 'Henüz seçilmedi'}
        onPress={() => navigation.navigate('EditInterests')}
      />

      <Text style={styles.sectionTitle}>Konum</Text>
      <Text style={styles.hint}>Yakınındaki etkinlikleri bulman için kullanılan konum.</Text>
      <LocationMapPicker
        location={location}
        onLocationChange={handleMapLocationChange}
        onRecenter={handleRecenter}
        isLocating={isLocating}
      />
      {location?.isFallback ? <Text style={styles.hint}>Konum izni alınamadı, Moda varsayılan olarak kullanıldı</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        testID="preferences-save-location-button"
        title={saving ? '...' : 'Kaydet'}
        onPress={handleSaveLocation}
        disabled={saving || !location}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  hint: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
