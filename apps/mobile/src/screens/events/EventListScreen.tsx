import { useCallback, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import type { AppStackParamList, AppTabParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { listEvents } from '../../api/events';
import type { Event } from '../../api/events';
import { getPendingRating, submitRating } from '../../api/participations';
import type { PendingRating } from '../../api/participations';
import { startTrial } from '../../api/users';
import { getCurrentLocation } from '../../location/current-location';
import Chip from '../../components/Chip';
import EmptyState from '../../components/EmptyState';
import HeaderIconButton from '../../components/HeaderIconButton';
import RatingModal from '../../components/RatingModal';
import TrialOfferModal from '../../components/TrialOfferModal';
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON, EVENT_CATEGORIES } from '../../constants/eventCategories';
import { formatEventWhen, isEventFillingFast } from '../../utils/events';
import { colors, radii, spacing, typography } from '../../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'KesfetTab'>,
  NativeStackScreenProps<AppStackParamList>
>;

const FEATURED_COUNT = 5;
const NEARBY_COUNT = 5;

function formatBadgeDate(iso: string): { day: string; month: string } {
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString('tr-TR', { day: '2-digit' }),
    month: date.toLocaleDateString('tr-TR', { month: 'short' }),
  };
}

async function shareEvent(event: Event) {
  try {
    await Share.share({ message: `${event.title} · ${formatEventWhen(event.startsAt)} · ${event.locationLabel}` });
  } catch {
    // user cancelled or share sheet failed — non-fatal
  }
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionSeeAllRow}>
        <Text style={styles.sectionSeeAll}>Tümünü Gör</Text>
        <MaterialIcons name="north-east" size={14} color={colors.textMuted} />
      </View>
    </View>
  );
}

interface FeaturedEventCardProps {
  event: Event;
  isSaved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

function FeaturedEventCard({ event, isSaved, onPress, onToggleSave }: FeaturedEventCardProps) {
  const categoryIcon = CATEGORY_ICONS[event.category] ?? DEFAULT_CATEGORY_ICON;
  const { day, month } = formatBadgeDate(event.startsAt);

  return (
    <Pressable
      testID={`featured-event-${event.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.featuredCard, pressed && styles.cardPressed]}
    >
      <View style={styles.featuredImage}>
        <MaterialIcons name={categoryIcon} size={48} color={colors.primary} />
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{day}</Text>
          <Text style={styles.dateBadgeMonth}>{month}</Text>
        </View>
        <View style={styles.overlayIconRow}>
          <Pressable
            testID={`featured-event-save-${event.id}`}
            onPress={onToggleSave}
            hitSlop={8}
            style={styles.overlayIconButton}
          >
            <MaterialIcons name={isSaved ? 'favorite' : 'favorite-border'} size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            testID={`featured-event-share-${event.id}`}
            onPress={() => shareEvent(event)}
            hitSlop={8}
            style={styles.overlayIconButton}
          >
            <MaterialIcons name="ios-share" size={16} color={colors.textPrimary} />
          </Pressable>
        </View>
        {isEventFillingFast(event) ? (
          <View style={styles.featuredLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Dolmak Üzere</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.featuredBody}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.featuredWhen}>{formatEventWhen(event.startsAt)}</Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="location-on" size={13} color={colors.textMuted} />
          <Text style={styles.feedMetaText} numberOfLines={1}>
            {event.locationLabel}
          </Text>
        </View>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{event.category}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Ücretsiz</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

interface NearbyEventCardProps {
  event: Event;
  onPress: () => void;
}

function NearbyEventCard({ event, onPress }: NearbyEventCardProps) {
  const categoryIcon = CATEGORY_ICONS[event.category] ?? DEFAULT_CATEGORY_ICON;

  return (
    <Pressable
      testID={`nearby-event-${event.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.nearbyCard, pressed && styles.cardPressed]}
    >
      <View style={styles.nearbyImage}>
        <MaterialIcons name={categoryIcon} size={28} color={colors.primary} />
      </View>
      <View style={styles.nearbyBody}>
        <Text style={styles.nearbyTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.featuredWhen} numberOfLines={1}>
          {formatEventWhen(event.startsAt)}
        </Text>
        <View style={styles.metaRow}>
          <MaterialIcons name="location-on" size={13} color={colors.textMuted} />
          <Text style={styles.feedMetaText} numberOfLines={1}>
            {event.locationLabel}
          </Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Ücretsiz</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function EventListScreen({ navigation }: Props) {
  const { token, user, refreshUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());

  const [pendingRating, setPendingRating] = useState<PendingRating | null>(null);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [showTrialOffer, setShowTrialOffer] = useState(false);
  const [trialAccepted, setTrialAccepted] = useState(false);
  const [isTrialSubmitting, setIsTrialSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.brandTitle}>Katıl</Text>,
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.background },
      headerLeft: () => <HeaderIconButton testID="map-explore-link" icon="map" onPress={() => navigation.navigate('MapExplore')} />,
    });
  }, [navigation]);

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
      if (token) {
        getPendingRating(token)
          // NestJS `null` döndüren bir handler'da boş gövde + content-type'sız bir yanıt
          // gönderiyor (Content-Length: 0), bu yüzden apiClient onu `undefined` olarak
          // ayrıştırıyor — state'i her zaman gerçek `null` olacak şekilde normalize ediyoruz.
          .then((result) => setPendingRating(result ?? null))
          .catch(() => {});
      }
    }, [fetchEvents, hasLoaded, token]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchEvents();
    setIsRefreshing(false);
  }

  function toggleSaved(eventId: string) {
    setSavedEventIds((current) => {
      const next = new Set(current);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }

  const isTrialEligible = !!user && !user.isPremium && user.premiumTrialEndsAt === null;

  async function handleSubmitRating(score: number) {
    if (!token || !pendingRating) return;
    setIsRatingSubmitting(true);
    try {
      await submitRating(pendingRating.id, score, token);
      setPendingRating(null);
      if (isTrialEligible) {
        setShowTrialOffer(true);
      }
    } finally {
      setIsRatingSubmitting(false);
    }
  }

  function handleDismissRating() {
    setPendingRating(null);
  }

  async function handleAcceptTrial() {
    if (!token) return;
    setIsTrialSubmitting(true);
    try {
      await startTrial(token);
      await refreshUser();
      setTrialAccepted(true);
    } finally {
      setIsTrialSubmitting(false);
    }
  }

  function handleDismissTrialOffer() {
    setShowTrialOffer(false);
    setTrialAccepted(false);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[typography.bodyMd, styles.error]}>{error}</Text>
      </View>
    );
  }

  const filteredEvents = selectedCategory ? events.filter((event) => event.category === selectedCategory) : events;
  const featuredEvents = events.slice(0, FEATURED_COUNT);
  const nearbyEvents = events.slice(FEATURED_COUNT, FEATURED_COUNT + NEARBY_COUNT);

  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.locationRow}>
        <MaterialIcons name="location-on" size={16} color={colors.textMuted} />
        <Text style={styles.locationLabel}>Kadıköy/Bostancı</Text>
      </View>
      <Text style={styles.heading}>Yakınındaki Aktiviteleri Keşfet</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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

      {featuredEvents.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Öne Çıkanlar" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
            {featuredEvents.map((event) => (
              <FeaturedEventCard
                key={event.id}
                event={event}
                isSaved={savedEventIds.has(event.id)}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                onToggleSave={() => toggleSaved(event.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {nearbyEvents.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Yakınımdakiler" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyRow}>
            {nearbyEvents.map((event) => (
              <NearbyEventCard
                key={event.id}
                event={event}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Tüm Etkinlikler</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {events.length === 0 ? (
        <View style={styles.emptyContainer}>
          {listHeader}
          <EmptyState title="Yakın çevrende henüz etkinlik yok" />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={<EmptyState title="Bu kategoride etkinlik yok" subtitle="Farklı bir kategori dene" />}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const isFillingFast = isEventFillingFast(item);
            const categoryIcon = CATEGORY_ICONS[item.category] ?? DEFAULT_CATEGORY_ICON;

            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              >
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name={categoryIcon} size={40} color={colors.primary} />
                  {isFillingFast ? (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveBadgeText}>Dolmak Üzere</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.capacity != null ? (
                      <View style={styles.spotsBadge}>
                        <MaterialIcons name="group" size={14} color={colors.primary} />
                        <Text style={styles.spotsBadgeText}>
                          {item.participantCount}/{item.capacity}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{formatEventWhen(item.startsAt)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {item.locationLabel}
                    </Text>
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.joinButton, pressed && styles.joinButtonPressed]}
                  onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
                >
                  <Text style={styles.joinButtonText}>Katıl</Text>
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}

      <Pressable
        testID="create-event-fab"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <MaterialIcons name="add" size={28} color={colors.onPrimary} />
      </Pressable>

      <RatingModal
        visible={pendingRating !== null}
        eventTitle={pendingRating?.event.title ?? ''}
        isSubmitting={isRatingSubmitting}
        onSubmit={handleSubmitRating}
        onDismiss={handleDismissRating}
      />
      <TrialOfferModal
        visible={showTrialOffer}
        hasAccepted={trialAccepted}
        isSubmitting={isTrialSubmitting}
        onAccept={handleAcceptTrial}
        onDismiss={handleDismissTrialOffer}
      />
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
  error: {
    color: colors.error,
  },
  brandTitle: {
    fontFamily: 'DMSans_800ExtraBold',
    fontSize: 20,
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.md,
  },
  listHeader: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  heading: {
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  chipRow: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  section: {
    gap: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  sectionSeeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionSeeAll: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textMuted,
  },
  featuredRow: {
    gap: spacing.md,
    paddingVertical: 2,
  },
  featuredCard: {
    width: 300,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.9,
  },
  featuredImage: {
    height: 200,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.textPrimary,
    borderRadius: radii.badge,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
  },
  dateBadgeDay: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    lineHeight: 20,
    color: colors.onPrimary,
  },
  dateBadgeMonth: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.onPrimary,
    opacity: 0.75,
  },
  overlayIconRow: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  overlayIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredBody: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: 6,
  },
  featuredTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 18,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  featuredWhen: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: colors.primary,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  tag: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radii.tag,
  },
  tagText: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
    color: colors.textPrimary,
  },
  nearbyRow: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  nearbyCard: {
    width: 300,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
  },
  nearbyImage: {
    width: 85,
    height: 85,
    borderRadius: 10,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyBody: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  nearbyTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: colors.textPrimary,
  },
  card: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imagePlaceholder: {
    height: 128,
    borderRadius: radii.card - 4,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: radii.chip,
  },
  featuredLiveBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
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
  cardBody: {
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
    flex: 1,
  },
  spotsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.chip,
  },
  spotsBadgeText: {
    ...typography.labelCaps,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  feedMetaText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: colors.textMuted,
  },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonPressed: {
    opacity: 0.85,
  },
  joinButtonText: {
    ...typography.bodyMd,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 16px rgba(176,47,0,0.35)',
  },
  fabPressed: {
    opacity: 0.9,
  },
});
