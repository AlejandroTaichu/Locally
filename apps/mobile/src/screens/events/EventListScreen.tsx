import { useCallback, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { listEvents } from '../../api/events';
import type { Event } from '../../api/events';
import { getCurrentLocation } from '../../location/current-location';

type Props = NativeStackScreenProps<AppStackParamList, 'EventList'>;

function formatStartsAt(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function EventListScreen({ navigation }: Props) {
  const { user, token, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const location = await getCurrentLocation();
      const result = await listEvents(token, { lat: location.lat, lng: location.lng });
      setEvents(result);
    } catch {
      setError('Etkinlikler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadEvents();
    }, [loadEvents]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {user ? <Text style={styles.greeting}>Merhaba, {user.displayName}</Text> : null}
        <Button title="Çıkış Yap" color="#c0392b" onPress={() => logout()} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.stateBlock} />
      ) : error ? (
        <Text style={[styles.stateBlock, styles.error]}>{error}</Text>
      ) : events.length === 0 ? (
        <Text style={styles.stateBlock}>Yakın çevrende henüz etkinlik yok</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={loadEvents} />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>{item.category} · {item.locationLabel}</Text>
              <Text style={styles.cardMeta}>{formatStartsAt(item.startsAt)}</Text>
            </Pressable>
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
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
  },
  stateBlock: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: '#666',
  },
  error: {
    color: '#c0392b',
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 13,
    color: '#666',
  },
});
