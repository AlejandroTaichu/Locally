import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { getEvent } from '../../api/events';
import type { Event } from '../../api/events';
import { decideParticipation, listParticipations, requestParticipation } from '../../api/participations';
import type { Participation } from '../../api/participations';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import HeaderIconButton from '../../components/HeaderIconButton';
import EventArtwork from '../../components/EventArtwork';
import { formatEventWhen, formatSpots, isEventFillingFast } from '../../utils/events';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EventDetail'>;

const MAX_VISIBLE_AVATARS = 8;

function getGenderRestrictionLabel(event: Pick<Event, 'genderRestriction'>): string | null {
  if (event.genderRestriction === 'female') return 'Sadece Kadın';
  if (event.genderRestriction === 'male') return 'Sadece Erkek';
  return null;
}

function getAgeRestrictionLabel(event: Pick<Event, 'minAge' | 'maxAge'>): string | null {
  if (event.minAge <= 13 && event.maxAge >= 99) return null;
  return `${event.minAge}-${event.maxAge} yaş`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2);
  return (initials ?? '').toUpperCase();
}

const JOIN_TYPE_LABEL: Record<Event['joinType'], string> = {
  instant: 'Katıl',
  approval: 'İstek Gönder',
};

const MY_STATUS_LABEL: Record<Participation['status'], string> = {
  joined: 'Katıldın ✓',
  approved: 'Katıldın ✓',
  pending: 'İsteğin gönderildi, onay bekleniyor',
  rejected: 'İsteğin reddedildi',
};

const CONFIRMED_STATUSES: Participation['status'][] = ['joined', 'approved'];

function buildDirectionsUrl(event: Event): string | undefined {
  const label = encodeURIComponent(event.locationLabel);
  return Platform.select({
    ios: `maps://?ll=${event.locationLat},${event.locationLng}&q=${label}`,
    android: `geo:${event.locationLat},${event.locationLng}?q=${event.locationLat},${event.locationLng}(${label})`,
  });
}

export default function EventDetailScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null>(null);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.brandTitle}>Katıl</Text>,
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.background },
      headerLeft: () => <HeaderIconButton testID="event-back-button" icon="arrow-back" onPress={() => navigation.goBack()} />,
      headerRight: () => <HeaderIconButton testID="event-share-button" icon="share" onPress={handleShare} />,
    });
  }, [navigation, event]);

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

  async function handleShare() {
    if (!event) return;
    try {
      await Share.share({
        message: `${event.title} · ${formatEventWhen(event.startsAt)} · ${event.locationLabel}`,
      });
    } catch {
      // user cancelled or share sheet failed — non-fatal
    }
  }

  function handleGetDirections() {
    if (!event) return;
    const url = buildDirectionsUrl(event);
    if (!url) return;
    Linking.openURL(url).catch(() => {
      // no maps app available — non-fatal
    });
  }

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

  const fillingFast = isEventFillingFast(event);
  const spotsLabel = formatSpots(event);
  const genderRestrictionLabel = getGenderRestrictionLabel(event);
  const ageRestrictionLabel = getAgeRestrictionLabel(event);
  const visibleAvatars = confirmedParticipants.slice(0, MAX_VISIBLE_AVATARS);
  const avatarOverflow = confirmedParticipants.length - visibleAvatars.length;
  const showFooter = !isOrganizer;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: showFooter ? 96 + insets.bottom : spacing.lg }]}
      >
        <View style={styles.hero}>
          <EventArtwork category={event.category} style={StyleSheet.absoluteFill} />
          {fillingFast ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>Dolmak Üzere</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.categoryTag}>{event.category.toUpperCase()}</Text>
        {genderRestrictionLabel || ageRestrictionLabel ? (
          <View style={styles.restrictionRow}>
            {genderRestrictionLabel ? (
              <View style={styles.restrictionBadge}>
                <MaterialIcons name="wc" size={12} color={colors.textSecondary} />
                <Text style={styles.restrictionText}>{genderRestrictionLabel}</Text>
              </View>
            ) : null}
            {ageRestrictionLabel ? (
              <View style={styles.restrictionBadge}>
                <MaterialIcons name="cake" size={12} color={colors.textSecondary} />
                <Text style={styles.restrictionText}>{ageRestrictionLabel}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        <Text style={styles.title}>{event.title}</Text>
        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        <View style={styles.infoGrid}>
          <View style={styles.infoGridRow}>
            <InfoCell icon="calendar-today" label="TARİH & SAAT" value={formatEventWhen(event.startsAt)} />
            <InfoCell icon="location-on" label="KONUM" value={event.locationLabel} numberOfLines={1} />
          </View>
          <View style={styles.infoGridRow}>
            <InfoCell icon="group" label="KONTENJAN" value={spotsLabel} />
            <InfoCell icon="payments" label="ÜCRET" value="Ücretsiz" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Katılımcılar ({confirmedParticipants.length})</Text>

          <View style={styles.divider} />
          <View style={styles.organizerCard}>
            <View style={styles.organizerAvatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(event.organizer.displayName)}</Text>
              </View>
              <View style={styles.organizerBadge}>
                <MaterialIcons name="star" size={10} color={colors.onPrimary} />
              </View>
            </View>
            <View>
              <Text style={styles.organizerName}>{event.organizer.displayName}</Text>
              <Text style={styles.organizerLabel}>Organizatör</Text>
              {event.organizer.ratingCount > 0 ? (
                <View style={styles.organizerRatingRow}>
                  <MaterialIcons name="star" size={14} color={colors.primary} />
                  <Text style={styles.organizerRatingText}>
                    {event.organizer.averageRating?.toFixed(1)} ({event.organizer.ratingCount} değerlendirme)
                  </Text>
                </View>
              ) : (
                <Text style={styles.organizerRatingMuted}>Henüz değerlendirme yok</Text>
              )}
            </View>
          </View>

          {confirmedParticipants.length === 0 ? (
            <Text style={styles.mutedText}>Henüz katılımcı yok</Text>
          ) : (
            <View style={styles.avatarStack}>
              {visibleAvatars.map((p, index) => (
                <View key={p.id} style={[styles.avatarSmall, index > 0 && styles.avatarOverlap]}>
                  <Text style={styles.avatarSmallText}>{getInitials(p.user.displayName)}</Text>
                </View>
              ))}
              {avatarOverflow > 0 ? (
                <View style={[styles.avatarSmall, styles.avatarOverlap, styles.avatarOverflow]}>
                  <Text style={styles.avatarSmallText}>+{avatarOverflow}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.mapSnippet}>
          <MapView
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_DEFAULT}
            pointerEvents="none"
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            initialRegion={{
              latitude: event.locationLat,
              longitude: event.locationLng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={{ latitude: event.locationLat, longitude: event.locationLng }} tracksViewChanges={false} />
          </MapView>
          <Pressable testID="get-directions-overlay" style={StyleSheet.absoluteFill} onPress={handleGetDirections} />
        </View>
        <Pressable testID="get-directions-link" onPress={handleGetDirections} style={styles.directionsRow} hitSlop={8}>
          <MaterialIcons name="directions" size={16} color={colors.primary} />
          <Text style={styles.directionsText}>{event.locationLabel} · Yol Tarifi Al</Text>
        </Pressable>

        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

        {isOrganizer && event.joinType === 'approval' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bekleyen İstekler</Text>
            {pendingParticipants.length === 0 ? (
              <Text style={styles.mutedText}>Bekleyen istek yok</Text>
            ) : (
              pendingParticipants.map((p) => (
                <View key={p.id} style={styles.pendingRow}>
                  <View style={styles.pendingIdentity}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{getInitials(p.user.displayName)}</Text>
                    </View>
                    <Text style={styles.infoCellValue}>{p.user.displayName}</Text>
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
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      {showFooter ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          {myParticipation ? (
            <Text style={styles.statusText}>{MY_STATUS_LABEL[myParticipation.status]}</Text>
          ) : (
            <Button
              testID="request-participation-button"
              icon="how-to-reg"
              title={isSubmitting ? 'Gönderiliyor...' : JOIN_TYPE_LABEL[event.joinType]}
              onPress={handleRequestParticipation}
              disabled={isSubmitting}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

interface InfoCellProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  numberOfLines?: number;
}

function InfoCell({ icon, label, value, numberOfLines }: InfoCellProps) {
  return (
    <View style={styles.infoCell}>
      <View style={styles.infoCellIconBox}>
        <MaterialIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoCellText}>
        <Text style={styles.infoCellLabel}>{label}</Text>
        <Text style={styles.infoCellValue} numberOfLines={numberOfLines}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  brandTitle: {
    ...typography.headlineSm,
    color: colors.primary,
    fontWeight: '800',
  },
  hero: {
    height: 240,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radii.chip,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryContainer,
  },
  liveBadgeText: {
    ...typography.labelCaps,
    color: colors.primary,
  },
  categoryTag: {
    ...typography.labelCaps,
    color: colors.primary,
    backgroundColor: 'rgba(176,47,0,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.chip,
    overflow: 'hidden',
  },
  restrictionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  restrictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.chip,
  },
  restrictionText: {
    ...typography.labelCaps,
    color: colors.textSecondary,
  },
  title: {
    ...typography.headlineMd,
    fontFamily: 'DMSans_700Bold',
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.8,
    color: colors.textPrimary,
  },
  description: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  infoGrid: {
    gap: spacing.sm,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  infoCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  infoCellIconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.input,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCellText: {
    flex: 1,
    gap: 2,
  },
  infoCellLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  infoCellValue: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  organizerAvatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.avatar,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  organizerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organizerLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  organizerName: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  organizerRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  organizerRatingText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  organizerRatingMuted: {
    ...typography.bodyMd,
    color: colors.textMuted,
    marginTop: 2,
  },
  mutedText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: radii.avatar,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOverlap: {
    marginLeft: -12,
  },
  avatarOverflow: {
    backgroundColor: colors.surfaceVariant,
  },
  avatarSmallText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mapSnippet: {
    height: 160,
    borderRadius: radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainer,
  },
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -spacing.xs,
  },
  directionsText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
  statusText: {
    ...typography.bodyLg,
    color: colors.primaryDark,
    fontWeight: '700',
    textAlign: 'center',
  },
  pendingRow: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
