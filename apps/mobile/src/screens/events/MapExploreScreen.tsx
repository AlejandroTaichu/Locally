import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { listEvents } from '../../api/events';
import type { Event } from '../../api/events';
import { getCurrentLocation } from '../../location/current-location';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import { EVENT_CATEGORIES } from '../../constants/eventCategories';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MapExplore'>;

function formatStartsAt(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function MapExploreScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      const location = await getCurrentLocation();
      if (cancelled) return;
      setRegion({ lat: location.lat, lng: location.lng });
      try {
        const result = await listEvents(token, { lat: location.lat, lng: location.lng });
        if (!cancelled) setEvents(result);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredEvents = selectedCategory ? events.filter((event) => event.category === selectedCategory) : events;

  if (isLoading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: region.lat,
          longitude: region.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {filteredEvents.map((event) => {
          const isSelected = selectedEvent?.id === event.id;
          return (
            <Marker
              key={event.id}
              coordinate={{ latitude: event.locationLat, longitude: event.locationLng }}
              onPress={() => setSelectedEvent(event)}
              tracksViewChanges={false}
            >
              <View style={[styles.marker, isSelected && styles.markerSelected]} />
            </Marker>
          );
        })}
      </MapView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        <Chip label="Tümü" selected={selectedCategory === null} onPress={() => setSelectedCategory(null)} />
        {EVENT_CATEGORIES.map((category) => (
          <Chip
            key={category}
            label={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>

      {selectedEvent ? (
        <View style={styles.cardWrapper}>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCategory}>{selectedEvent.category.toUpperCase()}</Text>
              <Text testID="map-card-close" style={styles.closeLink} onPress={() => setSelectedEvent(null)}>
                Kapat
              </Text>
            </View>
            <Text style={styles.cardTitle}>{selectedEvent.title}</Text>
            <Text style={styles.cardMeta}>{selectedEvent.locationLabel}</Text>
            <Text style={styles.cardMeta}>{formatStartsAt(selectedEvent.startsAt)}</Text>

            <Text
              testID="map-card-detail-link"
              style={styles.detailLink}
              onPress={() => navigation.navigate('EventDetail', { eventId: selectedEvent.id })}
            >
              Detaya git →
            </Text>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.onPrimary,
  },
  markerSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: colors.primaryDark,
  },
  chipScroll: {
    position: 'absolute',
    top: spacing.sm,
    left: 0,
    right: 0,
  },
  chipRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  cardWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  card: {
    padding: spacing.md,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    ...typography.labelCaps,
    color: colors.primaryDark,
  },
  closeLink: {
    ...typography.bodyMd,
    color: colors.textMuted,
  },
  cardTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  detailLink: {
    ...typography.bodyMd,
    color: colors.primaryDark,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
