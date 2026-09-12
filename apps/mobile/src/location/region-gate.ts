import * as Location from "expo-location";
import { ensureForegroundPermission } from "./foreground-permission";
import { withTimeout } from "./with-timeout";

// Bkz. Katıl-Vault ADR 0014 — bu bir Event alanı değil, uygulama seviyesinde bir erişim kapısı.
// Kapıdan geçen bir kullanıcı event'i istediği yerde açabilir, kısıt sadece "şu an nerede olduğun".
//
// Reverse-geocode ile şehir/il adını okuyup metinle karşılaştırma denendi ama simülatörde (ve
// muhtemelen Apple/Google'ın seyrek veri döndürdüğü bölgelerde) city/region alanları null
// dönebiliyor — örn. Moda'daki bir park içi konum için sadece sokak adı geldi, şehir/il boştu.
// Bunun yerine ham koordinattan doğrudan mesafe hesaplanıyor: her şehir için bilinen bir merkez
// + geniş bir yarıçap (metro alanını kapsayacak kadar), string eşleştirmesine hiç ihtiyaç yok.
interface SupportedCity {
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

const SUPPORTED_CITIES: SupportedCity[] = [
  { name: "İstanbul", lat: 41.0082, lng: 28.9784, radiusKm: 60 },
  { name: "Ankara", lat: 39.9334, lng: 32.8597, radiusKm: 40 },
  { name: "İzmir", lat: 38.4237, lng: 27.1428, radiusKm: 40 },
  { name: "Antalya", lat: 36.8969, lng: 30.7133, radiusKm: 40 },
];

export type RegionGateResult =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        "permission-denied" | "unsupported-region" | "location-unavailable";
    };

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function isWithinSupportedCity(lat: number, lng: number): boolean {
  return SUPPORTED_CITIES.some(
    (city) =>
      haversineDistanceKm(lat, lng, city.lat, city.lng) <= city.radiusKm,
  );
}

export async function checkRegionAccess(
  retryDenied = false,
  allowPrompt = true,
): Promise<RegionGateResult> {
  try {
    const { status } = allowPrompt
      ? await ensureForegroundPermission(retryDenied)
      : await Location.getForegroundPermissionsAsync();
    if (status !== "granted")
      return { allowed: false, reason: "permission-denied" };
    if (!(await withTimeout(Location.hasServicesEnabledAsync(), 3000)))
      return { allowed: false, reason: "location-unavailable" };
    // A recent, reasonably accurate OS fix avoids unnecessary cold-start GPS waits.
    const recent = await withTimeout(
      Location.getLastKnownPositionAsync({
        maxAge: 120_000,
        requiredAccuracy: 1000,
      }),
      2000,
    ).catch(() => null);
    const position =
      recent ??
      (await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        12000,
      ));
    if (
      isWithinSupportedCity(position.coords.latitude, position.coords.longitude)
    ) {
      return { allowed: true };
    }
    return { allowed: false, reason: "unsupported-region" };
  } catch {
    return { allowed: false, reason: "location-unavailable" };
  }
}
