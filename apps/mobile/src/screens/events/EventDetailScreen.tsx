import { useCallback, useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { getEvent } from '../../api/events';
import type { Event } from '../../api/events';
import { decideParticipation, listParticipations, requestParticipation } from '../../api/participations';
import type { Participation } from '../../api/participations';
import { ApiError } from '../../api/client';

type Props = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

function formatStartsAt(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' });
}

const JOIN_TYPE_LABEL: Record<Event['joinType'], string> = {
  instant: 'Direkt katılım',
  approval: 'Onaylı katılım',
};

const MY_STATUS_LABEL: Record<Participation['status'], string> = {
  joined: 'Katıldın ✓',
  approved: 'Katıldın ✓',
  pending: 'İsteğin gönderildi, onay bekleniyor',
  rejected: 'İsteğin reddedildi',
};

const CONFIRMED_STATUSES: Participation['status'][] = ['joined', 'approved'];

export default function EventDetailScreen({ route }: Props) {
  const { eventId } = route.params;
  const { token, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    Promise.all([getEvent(eventId, token), listParticipations(eventId, token)])
      .then(([eventResult, participationsResult]) => {
        setEvent(eventResult);
        setParticipations(participationsResult);
      })
      .catch(() => setError('Etkinlik yüklenemedi'))
      .finally(() => setIsLoading(false));
  }, [eventId, token]);

  useFocusEffect(load);

  async function handleRequestParticipation() {
    if (!token) return;
    setActionError(null);
    setIsSubmitting(true);
    try {
      await requestParticipation(eventId, token);
      load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDecide(participationId: string, status: 'approved' | 'rejected') {
    if (!token) return;
    setActionError(null);
    setDecidingId(participationId);
    try {
      await decideParticipation(participationId, status, token);
      load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setDecidingId(null);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Etkinlik bulunamadı'}</Text>
      </View>
    );
  }

  const isOrganizer = user?.id === event.organizer.id;
  const myParticipation = participations.find((p) => p.userId === user?.id) ?? null;
  const confirmedParticipants = participations.filter((p) => CONFIRMED_STATUSES.includes(p.status));
  const pendingParticipants = participations.filter((p) => p.status === 'pending');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>{event.category}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Konum</Text>
        <Text style={styles.value}>{event.locationLabel}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Zaman</Text>
        <Text style={styles.value}>{formatStartsAt(event.startsAt)}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Katılım</Text>
        <Text style={styles.value}>
          {JOIN_TYPE_LABEL[event.joinType]}
          {event.capacity ? ` · ${confirmedParticipants.length}/${event.capacity}` : ''}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Organizatör</Text>
        <Text style={styles.value}>{event.organizer.displayName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Katılımcılar</Text>
        {confirmedParticipants.length === 0 ? (
          <Text style={styles.value}>Henüz katılımcı yok</Text>
        ) : (
          confirmedParticipants.map((p) => (
            <Text key={p.id} style={styles.value}>
              {p.user.displayName}
            </Text>
          ))
        )}
      </View>

      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      {!isOrganizer && !myParticipation ? (
        <Button
          testID="request-participation-button"
          title={isSubmitting ? 'Gönderiliyor...' : event.joinType === 'instant' ? 'Katıl' : 'İstek Gönder'}
          onPress={handleRequestParticipation}
          disabled={isSubmitting}
        />
      ) : null}

      {!isOrganizer && myParticipation ? (
        <Text style={styles.value}>{MY_STATUS_LABEL[myParticipation.status]}</Text>
      ) : null}

      {isOrganizer && event.joinType === 'approval' ? (
        <View style={styles.section}>
          <Text style={styles.label}>Bekleyen İstekler</Text>
          {pendingParticipants.length === 0 ? (
            <Text style={styles.value}>Bekleyen istek yok</Text>
          ) : (
            pendingParticipants.map((p) => (
              <View key={p.id} style={styles.pendingRow}>
                <Text style={styles.value}>{p.user.displayName}</Text>
                <View style={styles.row}>
                  <Button
                    testID={`approve-participation-${p.id}`}
                    title={decidingId === p.id ? '...' : 'Onayla'}
                    onPress={() => handleDecide(p.id, 'approved')}
                    disabled={decidingId !== null}
                  />
                  <Button
                    testID={`reject-participation-${p.id}`}
                    title={decidingId === p.id ? '...' : 'Reddet'}
                    color="#c0392b"
                    onPress={() => handleDecide(p.id, 'rejected')}
                    disabled={decidingId !== null}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  meta: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 16,
  },
  error: {
    color: '#c0392b',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pendingRow: {
    gap: 4,
    marginTop: 8,
  },
});
