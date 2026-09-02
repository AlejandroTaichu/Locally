import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { listEvents } from '../../api/events';
import type { Event } from '../../api/events';
import { getCurrentLocation } from '../../location/current-location';
import Button from '../../components/Button';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import FadeSlideIn from '../../components/FadeSlideIn';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EventList'>;

function formatStartsAt(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function EventListScreen({ navigation }: Props) {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const location = await getCurrentLocation();
      const result = await listEvents(token, { lat: location.lat, lng: location.lng });
      setEvents(result);
    } catch {
      setError('Etkinlikler yüklenemedi');
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded) {
        setIsLoading(true);
      }
      fetchEvents().finally(() => {
        setIsLoading(false);
        setHasLoaded(true);
      });
    }, [fetchEvents, hasLoaded]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchEvents();
    setIsRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <FadeSlideIn>
        <View style={styles.header}>
          {user ? <Text style={styles.greeting}>Merhaba, {user.displayName}</Text> : null}
          <Pressable testID="profile-link" onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.profileLink}>Profil</Text>
          </Pressable>
        </View>
      </FadeSlideIn>

      {isLoading ? (
        <ActivityIndicator style={styles.stateBlock} color={colors.primary} />
      ) : error ? (
        <Text style={[styles.stateBlock, styles.error]}>{error}</Text>
      ) : events.length === 0 ? (
        <EmptyState title="Yakın çevrende henüz etkinlik yok" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
              <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.locationLabel}</Text>
              <Text style={styles.cardMeta}>{formatStartsAt(item.startsAt)}</Text>
            </Card>
          )}
        />
      )}

      <Button title="Etkinlik Oluştur" onPress={() => navigation.navigate('CreateEvent')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  profileLink: {
    ...typography.bodyMd,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  stateBlock: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.textSecondary,
  },
  error: {
    color: colors.error,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: 4,
  },
  cardCategory: {
    ...typography.labelCaps,
    color: colors.primaryDark,
  },
  cardTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  cardMeta: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
});
