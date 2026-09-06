import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getCurrentLocation } from '../../location/current-location';
import { colors, radii, spacing, typography } from '../../theme';

export interface Neighborhood {
  name: string;
  district: string;
  lat: number;
  lng: number;
}

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: 'Kadıköy', district: 'İstanbul', lat: 40.9906, lng: 29.0274 },
  { name: 'Bostancı', district: 'Kadıköy, İstanbul', lat: 40.9614, lng: 29.0928 },
  { name: 'Moda', district: 'Kadıköy, İstanbul', lat: 40.9789, lng: 29.0369 },
  { name: 'Suadiye', district: 'Kadıköy, İstanbul', lat: 40.9647, lng: 29.0891 },
  { name: 'Caddebostan', district: 'Kadıköy, İstanbul', lat: 40.968, lng: 29.07 },
];

interface LocationStepProps {
  value: { lat: number; lng: number };
  onChange: (location: { lat: number; lng: number }) => void;
}

export default function LocationStep({ value, onChange }: LocationStepProps) {
  async function handleUseCurrentLocation() {
    const location = await getCurrentLocation();
    onChange({ lat: location.lat, lng: location.lng });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nerede yaşıyorsun?</Text>
      <Text style={styles.subtitle}>Sana yakın etkinlikleri gösterelim.</Text>

      <View style={styles.list}>
        {NEIGHBORHOODS.map((neighborhood, index) => {
          const isSelected = value.lat === neighborhood.lat && value.lng === neighborhood.lng;
          const isLast = index === NEIGHBORHOODS.length - 1;
          return (
            <Pressable
              key={neighborhood.name}
              testID={`neighborhood-${neighborhood.name}`}
              onPress={() => onChange({ lat: neighborhood.lat, lng: neighborhood.lng })}
              style={[styles.row, !isLast && styles.rowBorder, isSelected && styles.rowSelected]}
            >
              <View style={styles.rowLeft}>
                <MaterialIcons name="location-on" size={20} color={isSelected ? colors.primary : colors.textMuted} />
                <View>
                  <Text style={styles.rowTitle}>{neighborhood.name}</Text>
                  <Text style={styles.rowSubtitle}>{neighborhood.district}</Text>
                </View>
              </View>
              {isSelected ? <MaterialIcons name="check" size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <Pressable testID="use-current-location" style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
        <MaterialIcons name="my-location" size={18} color={colors.textPrimary} />
        <Text style={styles.currentLocationText}>Şu anki konumumu kullan</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  title: { ...typography.headlineMd, color: colors.textPrimary },
  subtitle: { ...typography.bodyMd, color: colors.textSecondary },
  list: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowSelected: {
    backgroundColor: colors.surfaceContainer,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowTitle: { ...typography.bodyLg, color: colors.textPrimary },
  rowSubtitle: { ...typography.labelCaps, color: colors.textMuted },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
  },
  currentLocationText: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
