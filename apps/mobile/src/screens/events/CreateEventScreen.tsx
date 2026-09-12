import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { createEvent } from "../../api/events";
import type { GenderRestriction, JoinType } from "../../api/events";
import { ApiError } from "../../api/client";
import {
  getCurrentLocation,
  geocodeAddress,
  reverseGeocodeLocation,
} from "../../location/current-location";
import type { CurrentLocation } from "../../location/current-location";
import Button from "../../components/Button";
import CreateEventBasicsStep from "./CreateEventBasicsStep";
import CreateEventCategoryStep from "./CreateEventCategoryStep";
import CreateEventLocationStep from "./CreateEventLocationStep";
import CreateEventDateTimeStep from "./CreateEventDateTimeStep";
import CreateEventCapacityStep from "./CreateEventCapacityStep";
import CreateEventAudienceStep from "./CreateEventAudienceStep";
import { colors, spacing, typography } from "../../theme";

type Props = NativeStackScreenProps<AppStackParamList, "CreateEvent">;

const MIN_AGE = 13;
const MAX_AGE = 99;
const MIN_CAPACITY = 1;
const MAX_CAPACITY = 50;

type FlowStep = "basics" | "location" | "datetime" | "capacity" | "audience";
type Step = FlowStep | "category";

const FLOW: FlowStep[] = [
  "basics",
  "location",
  "datetime",
  "capacity",
  "audience",
];
const STEP_TITLES: Record<FlowStep, string> = {
  basics: "Temel Bilgiler",
  location: "Konum",
  datetime: "Tarih & Saat",
  capacity: "Kapasite & Katılım",
  audience: "Kimler Katılabilir",
};

function combineDateAndTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return combined;
}

export default function CreateEventScreen({ navigation }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const { token } = useAuth();
  const [step, setStep] = useState<Step>("basics");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [location, setLocation] = useState<CurrentLocation | null>(null);
  const [addressQuery, setAddressQuery] = useState("");
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [date, setDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [time, setTime] = useState(new Date());
  const [capacityText, setCapacityText] = useState("4");
  const [joinType, setJoinType] = useState<JoinType>("instant");
  const [genderRestriction, setGenderRestriction] =
    useState<GenderRestriction>("all");
  const [minAge, setMinAge] = useState(MIN_AGE);
  const [maxAge, setMaxAge] = useState(MAX_AGE);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const locationSelectionId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setIsLocating(true);
    getCurrentLocation()
      .then(async (current) => {
        if (cancelled) return;
        const selectionId = ++locationSelectionId.current;
        setLocation(current);
        setIsResolvingAddress(true);
        const label = await reverseGeocodeLocation(current);
        if (!cancelled && selectionId === locationSelectionId.current) {
          if (label) setLocationLabel(label);
          setIsResolvingAddress(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Konum alınamadı");
      })
      .finally(() => {
        if (!cancelled) {
          setIsLocating(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUseCurrentLocation() {
    const selectionId = ++locationSelectionId.current;
    Keyboard.dismiss();
    setIsLocating(true);
    setIsSearchingAddress(false);
    setIsResolvingAddress(false);
    setError(null);
    try {
      const current = await getCurrentLocation();
      if (selectionId !== locationSelectionId.current) return;
      setLocation(current);
      setIsResolvingAddress(true);
      const label = await reverseGeocodeLocation(current);
      if (selectionId === locationSelectionId.current && label) setLocationLabel(label);
    } catch {
      setError("Konum alınamadı");
    } finally {
      setIsLocating(false);
      if (selectionId === locationSelectionId.current) setIsResolvingAddress(false);
    }
  }

  async function handleSearchAddress() {
    if (!addressQuery.trim()) return;
    const selectionId = ++locationSelectionId.current;
    Keyboard.dismiss();
    setIsSearchingAddress(true);
    setIsResolvingAddress(false);
    setError(null);
    try {
      const found = await geocodeAddress(addressQuery.trim());
      if (selectionId !== locationSelectionId.current) return;
      if (found) {
        setLocation({ ...found, isFallback: false });
        setLocationLabel(addressQuery.trim());
      } else {
        setError("Adres bulunamadı, haritadan dokunarak seçebilirsin");
      }
    } finally {
      if (selectionId === locationSelectionId.current) setIsSearchingAddress(false);
    }
  }

  async function handleMapLocationChange(coordinate: { lat: number; lng: number }) {
    const selectionId = ++locationSelectionId.current;
    setIsSearchingAddress(false);
    setLocation({ ...coordinate, isFallback: false });
    setIsResolvingAddress(true);
    const label = await reverseGeocodeLocation(coordinate);
    if (selectionId === locationSelectionId.current) {
      if (label) setLocationLabel(label);
      setIsResolvingAddress(false);
    }
  }

  function handleLocationLabelChange(value: string) {
    locationSelectionId.current += 1;
    setIsSearchingAddress(false);
    setIsResolvingAddress(false);
    setLocationLabel(value);
  }

  function handleMinAgeChange(next: number) {
    setMinAge(next);
    if (next > maxAge) setMaxAge(next);
  }

  function handleMaxAgeChange(next: number) {
    setMaxAge(next);
    if (next < minAge) setMinAge(next);
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setError(null);
    if (!title.trim() || !category || !locationLabel.trim()) {
      setError("Başlık, kategori ve konum açıklaması gerekli");
      return;
    }
    if (!location) {
      setError("Önce konumunu ekle");
      return;
    }
    const capacity = Number.parseInt(capacityText, 10);
    if (
      !Number.isFinite(capacity) ||
      capacity < MIN_CAPACITY ||
      capacity > MAX_CAPACITY
    ) {
      setError(`Kontenjan ${MIN_CAPACITY}-${MAX_CAPACITY} arasında olmalı`);
      return;
    }
    if (!token) {
      return;
    }
    if (combineDateAndTime(date, time).getTime() <= Date.now()) {
      setError(
        "Başlangıç zamanı gelecekte olmalı. Tarih ve saat adımını kontrol et.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createEvent(
        {
          title: title.trim(),
          description: description.trim() ? description.trim() : undefined,
          category,
          locationLat: location.lat,
          locationLng: location.lng,
          locationLabel: locationLabel.trim(),
          startsAt: combineDateAndTime(date, time).toISOString(),
          capacity,
          joinType,
          genderRestriction,
          minAge,
          maxAge,
        },
        token,
      );
      navigation.navigate("Tabs");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bir şeyler ters gitti");
    } finally {
      setIsSubmitting(false);
    }
  }

  const flowIndex =
    step === "category" ? FLOW.indexOf("basics") : FLOW.indexOf(step);
  const isFirstStep = flowIndex === 0;
  const isLastStep = flowIndex === FLOW.length - 1;

  const canContinue =
    step === "basics"
      ? title.trim().length > 0 && category != null
      : step === "location"
        ? locationLabel.trim().length > 0 && location != null
        : step === "capacity"
          ? (() => {
              const capacity = Number.parseInt(capacityText, 10);
              return (
                Number.isFinite(capacity) &&
                capacity >= MIN_CAPACITY &&
                capacity <= MAX_CAPACITY
              );
            })()
          : true;

  function handleContinue() {
    Keyboard.dismiss();
    setError(null);
    if (
      step === "datetime" &&
      combineDateAndTime(date, time).getTime() <= Date.now()
    ) {
      setError("Henüz gelmemiş bir tarih ve saat seç.");
      return;
    }
    if (isLastStep) {
      handleSubmit();
      return;
    }
    const nextIndex = FLOW.indexOf(step as FlowStep) + 1;
    setStep(FLOW[nextIndex]);
  }

  function handleBack() {
    Keyboard.dismiss();
    setError(null);
    if (step === "category") {
      setStep("basics");
      return;
    }
    if (isFirstStep) {
      navigation.goBack();
      return;
    }
    const prevIndex = FLOW.indexOf(step as FlowStep) - 1;
    setStep(FLOW[prevIndex]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri"
            testID="create-event-back"
            onPress={handleBack}
            style={styles.backButton}
            disabled={isSubmitting}
          >
            <MaterialIcons
              name="arrow-back"
              size={22}
              color={colors.textSecondary}
            />
          </Pressable>
          <Text style={styles.brandTitle}>Yeni bir buluşma.</Text>
          <Text style={styles.stepCount}>
            {step === "category"
              ? "Kategori"
              : `${flowIndex + 1} / ${FLOW.length}`}
          </Text>
        </View>
        {step !== "category" ? (
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 1,
              max: FLOW.length,
              now: flowIndex + 1,
              text: STEP_TITLES[step],
            }}
            style={styles.progressTrack}
          >
            {FLOW.map((item, index) => (
              <View
                key={item}
                style={[
                  styles.progressSegment,
                  index <= flowIndex && styles.progressFill,
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {step === "category" ? (
        <CreateEventCategoryStep
          category={category}
          onSave={(next) => {
            setCategory(next);
            setStep("basics");
          }}
          onCancel={() => setStep("basics")}
          bottomInset={bottom}
        />
      ) : (
        <>
          <ScrollView
            key={step}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Text style={styles.eyebrow}>
              {STEP_TITLES[step].toLocaleUpperCase("tr-TR")}
            </Text>
            {step === "basics" ? (
              <CreateEventBasicsStep
                title={title}
                onTitleChange={setTitle}
                description={description}
                onDescriptionChange={setDescription}
                category={category}
                onOpenCategory={() => {
                  Keyboard.dismiss();
                  setStep("category");
                }}
              />
            ) : null}
            {step === "location" ? (
              <CreateEventLocationStep
                locationLabel={locationLabel}
                onLocationLabelChange={handleLocationLabelChange}
                addressQuery={addressQuery}
                onAddressQueryChange={setAddressQuery}
                onSearchAddress={handleSearchAddress}
                isSearchingAddress={isSearchingAddress}
                location={location}
                onLocationChange={handleMapLocationChange}
                onRecenter={handleUseCurrentLocation}
                isLocating={isLocating}
                isResolvingAddress={isResolvingAddress}
              />
            ) : null}
            {step === "datetime" ? (
              <CreateEventDateTimeStep
                date={date}
                onDateChange={setDate}
                time={time}
                onTimeChange={setTime}
              />
            ) : null}
            {step === "capacity" ? (
              <CreateEventCapacityStep
                capacityText={capacityText}
                onCapacityTextChange={setCapacityText}
                minCapacity={MIN_CAPACITY}
                maxCapacity={MAX_CAPACITY}
                joinType={joinType}
                onJoinTypeChange={setJoinType}
              />
            ) : null}
            {step === "audience" ? (
              <CreateEventAudienceStep
                genderRestriction={genderRestriction}
                onGenderRestrictionChange={setGenderRestriction}
                minAge={minAge}
                onMinAgeChange={handleMinAgeChange}
                maxAge={maxAge}
                onMaxAgeChange={handleMaxAgeChange}
                minAgeLimit={MIN_AGE}
                maxAgeLimit={MAX_AGE}
              />
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: bottom + spacing.sm }]}>
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}
            <Text style={styles.footerHint}>
              {isLastStep
                ? "Hazırsan planını paylaş. Buluşma burada başlasın."
                : `Sırada: ${STEP_TITLES[FLOW[flowIndex + 1]]}`}
            </Text>
            <Button
              testID={
                isLastStep
                  ? "create-event-submit-button"
                  : "create-event-continue-button"
              }
              title={isLastStep ? "Etkinliği oluştur" : "Devam et"}
              icon={isLastStep ? "north-east" : "arrow-forward"}
              loading={isSubmitting}
              onPress={handleContinue}
              disabled={isSubmitting || !canContinue}
            />
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandTitle: {
    flex: 1,
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  progressTrack: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressFill: {
    backgroundColor: colors.textPrimary,
  },
  stepCount: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: colors.textSecondary,
  },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.primary,
    marginBottom: 16,
  },
  footerHint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.xs,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
