import * as Location from "expo-location";

// Moda, Kadıköy — used when location permission is denied or unavailable,
// matching the single-neighborhood launch focus (see Katıl-Vault Büyüme-Stratejisi).
const FALLBACK_LOCATION = { lat: 40.9789, lng: 29.0369 };

export interface CurrentLocation {
  lat: number;
  lng: number;
  isFallback: boolean;
}

export async function getCurrentLocation(): Promise<CurrentLocation> {
  // The entry gate owns permission prompts. Screens only read the existing grant.
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== "granted") {
    return { ...FALLBACK_LOCATION, isFallback: true };
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      isFallback: false,
    };
  } catch {
    return { ...FALLBACK_LOCATION, isFallback: true };
  }
}

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length === 0) return null;
    return { lat: results[0].latitude, lng: results[0].longitude };
  } catch {
    return null;
  }
}

export async function reverseGeocodeLocation(
  coordinate: { lat: number; lng: number },
): Promise<string | null> {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: coordinate.lat,
      longitude: coordinate.lng,
    });
    const address = results[0];
    if (!address) return null;

    const street = [address.streetNumber, address.street].filter(Boolean).join(" ");
    const parts = [address.name, street, address.district, address.city]
      .filter((part): part is string => Boolean(part?.trim()))
      .filter((part, index, all) => all.indexOf(part) === index);
    return parts.slice(0, 3).join(", ") || address.formattedAddress || null;
  } catch {
    return null;
  }
}
