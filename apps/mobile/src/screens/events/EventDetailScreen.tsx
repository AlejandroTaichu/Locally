import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { getEvent } from '../../api/events';
import type { Event } from '../../api/events';
import { decideParticipation, listParticipations, requestParticipation } from '../../api/participations';
import type { Participation } from '../../api/participations';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

function formatStartsAt(iso: string): string {
  return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2);
  return (initials ?? '').toUpperCase();
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
        <ActivityIndicator color={colors.primary} />
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
      <Text style={styles.category}>{event.category.toUpperCase()}</Text>
      <Text style={styles.title}>{event.title}</Text>
      {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

      <Card style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Konum</Text>
          <Text style={styles.infoValue}>{event.locationLabel}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Zaman</Text>
          <Text style={styles.infoValue}>{formatStartsAt(event.startsAt)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Katılım</Text>
          <Text style={styles.infoValue}>
            {JOIN_TYPE_LABEL[event.joinType]}
            {event.capacity ? ` · ${confirmedParticipants.length}/${event.capacity}` : ''}
          </Text>
        </View>
      </Card>

      <Card style={styles.organizerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(event.organizer.displayName)}</Text>
        </View>
        <View>
          <Text style={styles.organizerLabel}>ORGANİZATÖR</Text>
          <Text style={styles.organizerName}>{event.organizer.displayName}</Text>
        </View>
      </Card>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Katılımcılar ({confirmedParticipants.length})</Text>
        {confirmedParticipants.length === 0 ? (
          <Text style={styles.mutedText}>Henüz katılımcı yok</Text>
        ) : (
          <View style={styles.avatarRow}>
            {confirmedParticipants.map((p) => (
              <View key={p.id} style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>{getInitials(p.user.displayName)}</Text>
              </View>
            ))}
          </View>
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

      {!isOrganizer && myParticipation ? <Text style={styles.statusText}>{MY_STATUS_LABEL[myParticipation.status]}</Text> : null}

      {isOrganizer && event.joinType === 'approval' ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bekleyen İstekler</Text>
          {pendingParticipants.length === 0 ? (
            <Text style={styles.mutedText}>Bekleyen istek yok</Text>
          ) : (
            pendingParticipants.map((p) => (
              <Card key={p.id} style={styles.pendingRow}>
                <View style={styles.pendingIdentity}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>{getInitials(p.user.displayName)}</Text>
                  </View>
                  <Text style={styles.infoValue}>{p.user.displayName}</Text>
                </View>
                <View style={styles.pendingActions}>
                  <Button
                    testID={`reject-participation-${p.id}`}
                    variant="outline"
                    title={decidingId === p.id ? '...' : 'Reddet'}
                    onPress={() => handleDecide(p.id, 'rejected')}
                    disabled={decidingId !== null}
                    style={styles.pendingButton}
                  />
                  <Button
                    testID={`approve-participation-${p.id}`}
                    title={decidingId === p.id ? '...' : 'Onayla'}
                    onPress={() => handleDecide(p.id, 'approved')}
                    disabled={decidingId !== null}
                    style={styles.pendingButton}
                  />
                </View>
              </Card>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  category: {
    ...typography.labelCaps,
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radii.chip,
    overflow: 'hidden',
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  description: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  infoCard: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.avatar,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  organizerLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  organizerName: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  mutedText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: radii.avatar,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
  statusText: {
    ...typography.bodyLg,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  pendingRow: {
    padding: spacing.sm,
    gap: spacing.xs,
  },
  pendingIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pendingButton: {
    flex: 1,
  },
});
