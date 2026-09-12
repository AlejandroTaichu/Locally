import { Keyboard, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";
import LocationMapPicker from "../../components/LocationMapPicker";
import type { CurrentLocation } from "../../location/current-location";
import { colors, spacing } from "../../theme";
import { stepStyles } from "./createEventStepStyles";
import StepSection from "./StepSection";

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
  isResolvingAddress: boolean;
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
  isResolvingAddress,
}: CreateEventLocationStepProps) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>Nerede{"\n"}buluşuyoruz?</Text>
      <Text style={stepStyles.stepSubtitle}>
        Kolay bulunan bir nokta seç. Kimse birbirini aramasın.
      </Text>

      <StepSection label="Haritada buluşma noktasını seç" icon="map">
        <View style={styles.searchRow}>
          <TextInput
            testID="event-address-input"
            accessibilityLabel="Adres ara"
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
            title="Ara"
            loading={isSearchingAddress}
            onPress={onSearchAddress}
            disabled={isSearchingAddress || !addressQuery.trim()}
          />
        </View>

        <LocationMapPicker
          location={location}
          onLocationChange={onLocationChange}
          onRecenter={onRecenter}
          isLocating={isLocating}
        />
        {location?.isFallback ? (
          <Text style={stepStyles.hint}>
            Konum izni alınamadı, Moda varsayılan olarak kullanıldı
          </Text>
        ) : null}
      </StepSection>
      <StepSection label="Konum adı" icon="place">
        <TextInput
          testID="event-location-label-input"
          accessibilityLabel="Buluşma noktası"
          style={stepStyles.input}
          placeholder={isResolvingAddress ? "Konum adı bulunuyor..." : "Örn. Moda Sahili Basketbol Sahası"}
          placeholderTextColor={colors.textMuted}
          value={locationLabel}
          onChangeText={onLocationLabelChange}
        />
        <Text style={stepStyles.hint}>
          {isResolvingAddress
            ? "Seçtiğin noktanın adresi bulunuyor."
            : "Pin seçilince otomatik dolar; istersen daha anlaşılır bir buluşma adı yazabilirsin."}
        </Text>
      </StepSection>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
  },
});
