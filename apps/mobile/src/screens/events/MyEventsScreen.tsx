import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import type { AppStackParamList, AppTabParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { listMyEvents } from '../../api/events';
import type { MyEventEntry } from '../../api/events';
import type { ParticipationStatus } from '../../api/participations';
import EmptyState from '../../components/EmptyState';
import EventArtwork from '../../components/EventArtwork';
import { formatEventWhen } from '../../utils/events';
import { colors, radii, spacing, typography } from '../../theme';
import { TAB_BAR_HEIGHT } from '../../navigation/PillTabBar';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'EtkinliklerimTab'>,
  NativeStackScreenProps<AppStackParamList>
>;

function getStatusLabel(status: ParticipationStatus): string {
  if (status === 'pending') return 'Onay Bekliyor';
  if (status === 'rejected') return 'Reddedildi';
  return 'Onaylandı';
}

export default function MyEventsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarClearance = insets.bottom + TAB_BAR_HEIGHT + spacing.sm;
  const { token } = useAuth();
  const [entries, setEntries] = useState<MyEventEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchMyEvents = useCallback(async () => {
    if (!token) return;
    const result = await listMyEvents(token);
    setEntries(result);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded) {
        setIsLoading(true);
      }
      fetchMyEvents().finally(() => {
        setIsLoading(false);
        setHasLoaded(true);
      });
    }, [fetchMyEvents, hasLoaded]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchMyEvents();
    setIsRefreshing(false);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(entry) => entry.event.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: tabBarClearance }]}
        ListHeaderComponent={<View style={{ gap: 8, paddingVertical: 16 }}><Text style={{ ...typography.displayMobile, color: colors.textPrimary, letterSpacing: -1 }}>Takviminde güzel şeyler var.</Text><Text style={styles.metaText}>Birlikte yapacağın planlar burada.</Text></View>}
        ListEmptyComponent={
          <EmptyState title="Henüz bir etkinliğe katılmadın" subtitle="Katıldığın veya oluşturduğun etkinlikler burada görünür" />
        }
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        renderItem={({ item, index }) => {
          return (
            <Pressable
              testID={`my-event-card-${index}`}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('EventDetail', { eventId: item.event.id })}
            >
              <EventArtwork category={item.event.category} style={styles.imagePlaceholder} />
              <View style={styles.cardBody}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.event.title}
                  </Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {item.role === 'organizer' ? 'Organizatör' : getStatusLabel(item.participationStatus ?? 'joined')}
                    </Text>
                  </View>
                </View>
                <View style={styles.metaRow}>
                  <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{formatEventWhen(item.event.startsAt)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.event.locationLabel}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
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
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  card: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardPressed: {
    opacity: 0.85,
  },
  imagePlaceholder: {
    height: 160,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
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
  roleBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.chip,
  },
  roleBadgeText: {
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
});
