import * as Location from 'expo-location';

// Moda, Kadıköy — used when location permission is denied or unavailable,
// matching the single-neighborhood launch focus (see Katıl-Vault Büyüme-Stratejisi).
const FALLBACK_LOCATION = { lat: 40.9789, lng: 29.0369 };

export interface CurrentLocation {
  lat: number;
  lng: number;
  isFallback: boolean;
}

export async function getCurrentLocation(): Promise<CurrentLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { ...FALLBACK_LOCATION, isFallback: true };
  }

  try {
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: position.coords.latitude, lng: position.coords.longitude, isFallback: false };
  } catch {
    return { ...FALLBACK_LOCATION, isFallback: true };
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length === 0) return null;
    return { lat: results[0].latitude, lng: results[0].longitude };
  } catch {
    return null;
  }
}
