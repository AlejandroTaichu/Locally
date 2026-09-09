import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../../components/Button';
import LocationMapPicker from '../../components/LocationMapPicker';
import type { CurrentLocation } from '../../location/current-location';
import { colors, spacing } from '../../theme';
import { stepStyles } from './createEventStepStyles';

interface CreateEventLocationStepProps {
  locationLabel: string;
  onLocationLabelChange: (value: string) => void;
  addressQuery: string;
  onAddressQueryChange: (value: string) => void;
  onSearchAddress: () => void;
  isSearchingAddress: boolean;
  location: CurrentLocation | null;
  onLocationChange: (coordinate: { lat: number; lng: number }) => void;
  onRecenter: () => void;
  isLocating: boolean;
}

export default function CreateEventLocationStep({
  locationLabel,
  onLocationLabelChange,
  addressQuery,
  onAddressQueryChange,
  onSearchAddress,
  isSearchingAddress,
  location,
  onLocationChange,
  onRecenter,
  isLocating,
}: CreateEventLocationStepProps) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Konum</Text>
      <Text style={stepStyles.stepSubtitle}>Etkinliğinin nerede olacağını belirt</Text>

      <Text style={stepStyles.fieldLabel}>Konum açıklaması</Text>
      <TextInput
        testID="event-location-label-input"
        style={stepStyles.input}
        placeholder="Örn. Moda Sahili Basketbol Sahası"
        placeholderTextColor={colors.textMuted}
        value={locationLabel}
        onChangeText={onLocationLabelChange}
      />

      <Text style={stepStyles.fieldLabel}>Adres ara</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={[stepStyles.input, styles.searchInput]}
          placeholder="Örn. Moda Sahili, Kadıköy"
          placeholderTextColor={colors.textMuted}
          value={addressQuery}
          onChangeText={onAddressQueryChange}
          onSubmitEditing={() => {
            Keyboard.dismiss();
            onSearchAddress();
          }}
          returnKeyType="search"
        />
        <Button
          variant="outline"
          title={isSearchingAddress ? 'Aranıyor...' : 'Ara'}
          onPress={onSearchAddress}
          disabled={isSearchingAddress || !addressQuery.trim()}
        />
      </View>

      <LocationMapPicker location={location} onLocationChange={onLocationChange} onRecenter={onRecenter} isLocating={isLocating} />
      {location?.isFallback ? <Text style={stepStyles.hint}>Konum izni alınamadı, Moda varsayılan olarak kullanıldı</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
  },
});
