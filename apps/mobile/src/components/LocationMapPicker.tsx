import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import type { MapPressEvent, MarkerDragStartEndEvent, Region } from 'react-native-maps';
import Button from './Button';
import { colors, radii, spacing, typography } from '../theme';
import type { CurrentLocation } from '../location/current-location';

interface LocationMapPickerProps {
  location: CurrentLocation | null;
  onLocationChange: (coordinate: { lat: number; lng: number }) => void;
  onRecenter: () => void;
  isLocating: boolean;
}

const MAP_HEIGHT = 220;
const DELTA = 0.01;

function regionFor(location: CurrentLocation): Region {
  return {
    latitude: location.lat,
    longitude: location.lng,
    latitudeDelta: DELTA,
    longitudeDelta: DELTA,
  };
}

export default function LocationMapPicker({ location, onLocationChange, onRecenter, isLocating }: LocationMapPickerProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(regionFor(location), 300);
  }, [location?.lat, location?.lng]);

  if (!location) {
    return (
      <View style={[styles.mapContainer, styles.loadingContainer]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  function handlePress(event: MapPressEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onLocationChange({ lat: latitude, lng: longitude });
  }

  function handleMarkerDragEnd(event: MarkerDragStartEndEvent) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    onLocationChange({ lat: latitude, lng: longitude });
  }

  return (
    <View>
      <View style={styles.mapContainer}>
        <MapView
          testID="location-map-picker"
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          initialRegion={regionFor(location)}
          scrollEnabled
          zoomEnabled
          pitchEnabled={false}
          rotateEnabled={false}
          onPress={handlePress}
        >
          <Marker
            coordinate={{ latitude: location.lat, longitude: location.lng }}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
        </MapView>
      </View>
      <Text style={styles.hint}>Haritayı gez, istediğin noktaya dokun veya pini sürükle</Text>
      <Button
        testID="location-recenter-button"
        variant="outline"
        title={isLocating ? 'Konum alınıyor...' : 'Konumumu Yeniden Kullan'}
        onPress={onRecenter}
        disabled={isLocating}
        style={styles.recenterButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  map: {
    flex: 1,
  },
  hint: {
    ...typography.labelCaps,
    color: colors.textMuted,
    textTransform: 'none',
    letterSpacing: 0,
    marginTop: spacing.xs,
  },
  recenterButton: {
    marginTop: spacing.xs,
  },
});
