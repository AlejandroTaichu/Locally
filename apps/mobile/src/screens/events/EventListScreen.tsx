import { useCallback, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import type {
  AppStackParamList,
  AppTabParamList,
} from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { listEvents } from "../../api/events";
import type { Event } from "../../api/events";
import { getPendingRating, submitRating } from "../../api/participations";
import type { PendingRating } from "../../api/participations";
import { startTrial } from "../../api/users";
import { getCurrentLocation } from "../../location/current-location";
import CategoryPill from "../../components/CategoryPill";
import EmptyState from "../../components/EmptyState";
import EventArtwork from "../../components/EventArtwork";
import Button from "../../components/Button";
import RatingModal from "../../components/RatingModal";
import TrialOfferModal from "../../components/TrialOfferModal";
import {
  ALL_CATEGORIES_EMOJI,
  CATEGORY_EMOJI,
  EVENT_CATEGORIES,
} from "../../constants/eventCategories";
import { formatEventWhen, isEventFillingFast } from "../../utils/events";
import { colors, typography } from "../../theme";
import { TAB_BAR_HEIGHT } from "../../navigation/PillTabBar";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, "KesfetTab">,
  NativeStackScreenProps<AppStackParamList>
>;

function distanceLabel(event: Event) {
  return event.distanceKm == null
    ? null
    : event.distanceKm.toLocaleString("tr-TR", { maximumFractionDigits: 1 }) +
        " km yakınında";
}

function SectionHeader({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {caption ? <Text style={styles.sectionCaption}>{caption}</Text> : null}
    </View>
  );
}

function EventRow({
  event,
  onPress,
  testID,
}: {
  event: Event;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={event.title + ", " + formatEventWhen(event.startsAt)}
      onPress={onPress}
      style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
    >
      <EventArtwork category={event.category} style={styles.rowArtwork} />
      <View style={styles.rowBody}>
        <Text style={styles.rowDate}>{formatEventWhen(event.startsAt)}</Text>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {event.locationLabel}
        </Text>
        {distanceLabel(event) ? (
          <Text style={styles.distance}>{distanceLabel(event)}</Text>
        ) : null}
      </View>
      <MaterialIcons name="north-east" size={19} color={colors.textSecondary} />
    </Pressable>
  );
}

function FeaturedCard({
  event,
  width,
  index,
  onPress,
}: {
  event: Event;
  width: number;
  index: number;
  onPress: () => void;
}) {
  const date = new Date(event.startsAt);
  const remaining =
    event.capacity == null
      ? null
      : Math.max(0, event.capacity - event.participantCount);
  async function share() {
    try {
      await Share.share({
        message:
          event.title +
          " · " +
          formatEventWhen(event.startsAt) +
          " · " +
          event.locationLabel,
      });
    } catch {
      /* Native share can be dismissed. */
    }
  }
  return (
    <View style={[styles.featuredCard, { width }]}>
      <Pressable
        testID={"featured-event-card-" + index}
        accessibilityRole="button"
        accessibilityLabel={event.title + ", etkinlik detayını aç"}
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <EventArtwork
          category={event.category}
          style={styles.featuredArtwork}
        />
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>
            {date.toLocaleDateString("tr-TR", { day: "2-digit" })}
          </Text>
          <Text style={styles.dateMonth}>
            {date
              .toLocaleDateString("tr-TR", { month: "short" })
              .toLocaleUpperCase("tr-TR")}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{event.category}</Text>
        </View>
        <View style={styles.featuredBody}>
          <Text style={styles.rowDate}>{formatEventWhen(event.startsAt)}</Text>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.inline}>
            <MaterialIcons name="place" size={15} color={colors.textMuted} />
            <Text style={[styles.meta, { flex: 1 }]} numberOfLines={1}>
              {event.locationLabel}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.inline}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.avatarLetter}>
                  {event.organizer.displayName
                    .slice(0, 1)
                    .toLocaleUpperCase("tr-TR")}
                </Text>
              </View>
              <Text style={styles.organizerName} numberOfLines={1}>
                {event.organizer.displayName.split(" ")[0]}
              </Text>
            </View>
            <Text
              style={[
                styles.spots,
                isEventFillingFast(event) && { color: colors.primary },
              ]}
            >
              {remaining === null
                ? event.participantCount + " kişi katılıyor"
                : remaining === 0
                  ? "Kontenjan doldu"
                  : remaining + " kişilik yer var"}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        testID={"featured-event-share-" + event.id}
        accessibilityRole="button"
        accessibilityLabel="Etkinliği paylaş"
        onPress={share}
        style={styles.shareButton}
      >
        <MaterialIcons name="ios-share" size={19} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

export default function EventListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(350, width - 68);
  const tabClearance = insets.bottom + TAB_BAR_HEIGHT + 28;
  const { token, user, refreshUser } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pendingRating, setPendingRating] = useState<PendingRating | null>(
    null,
  );
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [showTrialOffer, setShowTrialOffer] = useState(false);
  const [trialAccepted, setTrialAccepted] = useState(false);
  const [isTrialSubmitting, setIsTrialSubmitting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const location = await getCurrentLocation();
      setEvents(
        await listEvents(token, { lat: location.lat, lng: location.lng }),
      );
    } catch {
      setError(
        "Etkinlikler yüklenemedi. Bağlantını kontrol edip tekrar deneyebilirsin.",
      );
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded) setIsLoading(true);
      fetchEvents().finally(() => {
        setIsLoading(false);
        setHasLoaded(true);
      });
      if (token)
        getPendingRating(token)
          .then((result) => setPendingRating(result ?? null))
          .catch(() => {});
    }, [fetchEvents, hasLoaded, token]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchEvents();
    setIsRefreshing(false);
  }
  async function handleSubmitRating(score: number) {
    if (!token || !pendingRating) return;
    setIsRatingSubmitting(true);
    try {
      await submitRating(pendingRating.id, score, token);
      setPendingRating(null);
      if (user && !user.isPremium && user.premiumTrialEndsAt === null)
        setShowTrialOffer(true);
    } finally {
      setIsRatingSubmitting(false);
    }
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

  const query = search.trim().toLocaleLowerCase("tr-TR");
  const filtering = selectedCategory !== null || query.length > 0;
  const filtered = events.filter(
    (event) =>
      (!selectedCategory || event.category === selectedCategory) &&
      (!query ||
        (event.title + " " + event.category + " " + event.locationLabel)
          .toLocaleLowerCase("tr-TR")
          .includes(query)),
  );
  const nearby = [...events]
    .filter((event) => event.distanceKm != null)
    .sort((a, b) => a.distanceKm! - b.distanceKm!)
    .slice(0, 3);
  const interests = events
    .filter((event) => user?.interests.includes(event.category))
    .slice(0, 3);
  const openEvent = (event: Event) =>
    navigation.navigate("EventDetail", { eventId: event.id });
  const resetFilters = () => {
    setSelectedCategory(null);
    setSearch("");
  };

  const header = (
    <View>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>BİRAZ DIŞARI, BİRAZ BİRLİKTE.</Text>
        <Text
          testID="discover-heading"
          accessibilityRole="header"
          style={styles.heading}
        >
          İyi bir plan,{"\n"}iyi bir{" "}
          <Text style={styles.headingAccent}>başlangıç.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Yakınında bir etkinlik, tanışacak yeni insanlar.
        </Text>
      </View>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={22} color={colors.textSecondary} />
        <TextInput
          testID="discover-search"
          accessibilityLabel="Etkinlik, kategori veya yer ara"
          style={styles.searchInput}
          placeholder="Bugün ne yapmak istersin?"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aramayı temizle"
            onPress={() => setSearch("")}
            style={styles.clearButton}
          >
            <MaterialIcons
              name="close"
              size={19}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        keyboardShouldPersistTaps="handled"
      >
        <CategoryPill
          testID="category-all"
          label="Tümü"
          emoji={ALL_CATEGORIES_EMOJI}
          selected={selectedCategory === null}
          onPress={() => setSelectedCategory(null)}
        />
        {EVENT_CATEGORIES.map((category) => (
          <CategoryPill
            key={category}
            testID={"category-" + category}
            label={category}
            emoji={CATEGORY_EMOJI[category] ?? ""}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>
      {error ? (
        <View style={styles.feedback}>
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
          <Button
            title="Tekrar dene"
            onPress={handleRefresh}
            loading={isRefreshing}
            variant="outline"
          />
        </View>
      ) : null}
      {isLoading ? (
        <View style={styles.feedback}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.meta}>Yakınındaki planlar geliyor…</Text>
        </View>
      ) : null}
      {!filtering && events.length > 0 ? (
        <>
          <SectionHeader title="Buluşma noktası" caption="Yeni planlar" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + 14}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredRail}
          >
            {events.slice(0, 5).map((event, index) => (
              <FeaturedCard
                key={event.id}
                event={event}
                index={index}
                width={cardWidth}
                onPress={() => openEvent(event)}
              />
            ))}
          </ScrollView>
          <Pressable
            testID="discover-map-banner"
            accessibilityRole="button"
            onPress={() => navigation.navigate("MapExplore")}
            style={({ pressed }) => [
              styles.mapBanner,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.mapIcon}>
              <MaterialIcons
                name="near-me"
                size={25}
                color={colors.textPrimary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapTitle}>Güzel planlar çok yakın.</Text>
              <Text style={styles.meta}>Haritada etrafına bir bak.</Text>
            </View>
            <MaterialIcons
              name="arrow-forward"
              size={21}
              color={colors.textPrimary}
            />
          </Pressable>
          {interests.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Tam senlik"
                caption="İlgi alanlarına göre"
              />
              {interests.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onPress={() => openEvent(event)}
                />
              ))}
            </View>
          ) : null}
          {nearby.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title="Hemen yakınında" caption="Mesafeye göre" />
              {nearby.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  testID={"nearby-event-" + event.id}
                  onPress={() => openEvent(event)}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}
      {!isLoading ? (
        <SectionHeader
          title={filtering ? "Bulduğumuz planlar" : "Tüm etkinlikler"}
          caption={filtered.length + " etkinlik"}
        />
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.wordmark}>
          <Text style={styles.brand}>katıl</Text>
          <View style={styles.brandDot} />
        </View>
        <View style={styles.topActions}>
          <Pressable
            testID="map-explore-link"
            accessibilityRole="button"
            accessibilityLabel="Yakınındaki etkinlikleri haritada keşfet"
            onPress={() => navigation.navigate("MapExplore")}
            style={styles.locationButton}
          >
            <MaterialIcons name="near-me" size={15} color={colors.primary} />
            <Text style={styles.locationText}>Yakınında</Text>
          </Pressable>
          <Pressable
            testID="create-event-fab"
            accessibilityRole="button"
            accessibilityLabel="Etkinlik oluştur"
            onPress={() => navigation.navigate("CreateEvent")}
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="add" size={24} color={colors.onPrimary} />
          </Pressable>
        </View>
      </View>
      <FlatList
        data={isLoading ? [] : filtered}
        keyExtractor={(event) => event.id}
        contentContainerStyle={{ paddingBottom: tabClearance + 76 }}
        ListHeaderComponent={header}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading && !error ? (
            <View style={styles.empty}>
              <EmptyState
                title={
                  filtering
                    ? "Bu planda henüz kimse yok."
                    : "İlk plan senden olsun."
                }
                subtitle={
                  filtering
                    ? "Başka bir kategori veya arama deneyebilirsin."
                    : "Bir etkinlik oluştur, birlikte yapacak insanları bul."
                }
              />
              <Button
                title={filtering ? "Filtreleri temizle" : "Etkinlik oluştur"}
                variant="outline"
                onPress={() =>
                  filtering
                    ? resetFilters()
                    : navigation.navigate("CreateEvent")
                }
              />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item, index }) => (
          <EventRow
            event={item}
            testID={`event-list-row-${index}`}
            onPress={() => openEvent(item)}
          />
        )}
      />
      <RatingModal
        visible={pendingRating !== null}
        eventTitle={pendingRating?.event.title ?? ""}
        isSubmitting={isRatingSubmitting}
        onSubmit={handleSubmitRating}
        onDismiss={() => setPendingRating(null)}
      />
      <TrialOfferModal
        visible={showTrialOffer}
        hasAccepted={trialAccepted}
        isSubmitting={isTrialSubmitting}
        onAccept={handleAcceptTrial}
        onDismiss={() => {
          setShowTrialOffer(false);
          setTrialAccepted(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 14,
  },
  wordmark: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: "DMSans_800ExtraBold",
    fontSize: 32,
    letterSpacing: -1.8,
    color: colors.textPrimary,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: colors.textPrimary,
  },
  intro: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 18 },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.8,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  heading: {
    fontFamily: "DMSans_700Bold",
    fontSize: 33,
    lineHeight: 37,
    letterSpacing: -1.3,
    color: colors.textPrimary,
  },
  headingAccent: { color: colors.primary },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 12,
  },
  searchContainer: {
    marginHorizontal: 24,
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 15,
  },
  clearButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  categories: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 8,
  },
  sectionHeader: {
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 12,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 21,
    letterSpacing: -0.6,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  sectionCaption: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: colors.textMuted,
  },
  featuredRail: { paddingHorizontal: 24, paddingBottom: 4, gap: 14 },
  featuredCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredArtwork: { height: 166 },
  featuredBody: { padding: 17, gap: 8 },
  featuredTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.7,
    color: colors.textPrimary,
  },
  dateBadge: {
    position: "absolute",
    left: 14,
    top: 14,
    minWidth: 48,
    padding: 7,
    borderRadius: 13,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  dateDay: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  dateMonth: {
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  categoryBadge: {
    position: "absolute",
    top: 129,
    left: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  categoryBadgeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
    color: colors.textPrimary,
  },
  shareButton: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  organizerAvatar: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceVariant,
  },
  avatarLetter: {
    fontFamily: "DMSans_700Bold",
    fontSize: 11,
    color: colors.textPrimary,
  },
  organizerName: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.textSecondary,
    maxWidth: 90,
  },
  spots: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  mapBanner: {
    margin: 24,
    padding: 16,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBEEE4",
    borderRadius: 18,
  },
  mapIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DAE2CF",
  },
  mapTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  section: { paddingBottom: 22 },
  eventRow: {
    marginHorizontal: 24,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    gap: 13,
    alignItems: "center",
  },
  rowArtwork: { width: 78, height: 92, borderRadius: 14 },
  rowBody: { flex: 1, gap: 5 },
  rowDate: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    lineHeight: 16,
    color: colors.primary,
  },
  rowTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  distance: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.75 },
  feedback: { padding: 24, gap: 14, alignItems: "center" },
  error: { ...typography.bodyMd, color: colors.error, textAlign: "center" },
  empty: { padding: 24, gap: 18 },
});
