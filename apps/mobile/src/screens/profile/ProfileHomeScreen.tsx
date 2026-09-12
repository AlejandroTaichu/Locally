import { useEffect, useLayoutEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type {
  AppStackParamList,
  AppTabParamList,
} from "../../navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { biometricPreference } from "../../auth/biometric-preference";
import { deleteMe, startTrial } from "../../api/users";
import { ApiError } from "../../api/client";
import Button from "../../components/Button";
import Card from "../../components/Card";
import SettingsRow from "../../components/SettingsRow";
import ToggleRow from "../../components/ToggleRow";
import { CATEGORY_EMOJI } from "../../constants/eventCategories";
import { colors, radii, spacing, typography } from "../../theme";
import { TAB_BAR_HEIGHT } from "../../navigation/PillTabBar";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, "ProfilTab">,
  NativeStackScreenProps<AppStackParamList>
>;

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

export default function ProfileHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarClearance = insets.bottom + TAB_BAR_HEIGHT + spacing.sm;
  const { user, token, logout, refreshUser } = useAuth();
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBiometricState() {
      const [hasHardware, isEnrolled, enabled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        biometricPreference.get(),
      ]);
      setBiometricAvailable(hasHardware && isEnrolled);
      setBiometricEnabled(enabled);
    }
    loadBiometricState();
  }, []);

  async function handleToggleBiometric(value: boolean) {
    setBiometricError(null);
    if (!value) {
      await biometricPreference.set(false);
      setBiometricEnabled(false);
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Face ID ile Hızlı Kilidi Aç",
    });
    if (result.success) {
      await biometricPreference.set(true);
      setBiometricEnabled(true);
    } else {
      setBiometricError("Doğrulama başarısız, tekrar dene");
    }
  }

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  async function handleStartTrial() {
    if (!token) return;
    setIsStartingTrial(true);
    setTrialError(null);
    try {
      await startTrial(token);
      await refreshUser();
    } catch (error) {
      setTrialError(
        error instanceof ApiError
          ? error.message
          : "Deneme başlatılamadı. Tekrar deneyebilirsin.",
      );
    } finally {
      setIsStartingTrial(false);
    }
  }

  async function handleDeleteAccount() {
    if (!token) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteMe(token);
      await logout();
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : "Hesap silinemedi, lütfen tekrar dene",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user) {
    return null;
  }

  const isTrialEligible = !user.isPremium && user.premiumTrialEndsAt === null;
  const isVerified =
    user.emailVerifiedAt != null || user.phoneVerifiedAt != null;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text
          testID="profile-heading"
          accessibilityRole="header"
          style={styles.headerTitle}
        >
          Senin köşen.
        </Text>
        <Pressable
          testID="profile-edit-pill"
          accessibilityRole="button"
          accessibilityLabel="Profilini düzenle"
          style={styles.editPill}
          onPress={() => navigation.navigate("EditPersonalInfo")}
        >
          <MaterialIcons name="edit" size={15} color={colors.textPrimary} />
          <Text style={styles.editPillText}>Düzenle</Text>
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: tabBarClearance + 24 },
        ]}
      >
        <View style={styles.identity}>
          <View style={styles.identityTop}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user.displayName)}
                </Text>
              </View>
              {isVerified ? (
                <View
                  accessibilityLabel="İletişim bilgisi doğrulandı"
                  style={styles.verifiedBadge}
                >
                  <MaterialIcons
                    name="check"
                    size={13}
                    color={colors.onPrimary}
                  />
                </View>
              ) : null}
            </View>
            <View style={styles.identityText}>
              <Text style={styles.eyebrow}>İYİ Kİ BURADASIN</Text>
              <Text style={styles.name}>{user.displayName}</Text>
              <Text style={styles.email}>
                {user.username ? "@" + user.username : user.email}
              </Text>
            </View>
          </View>
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
          {isVerified ? (
            <View style={styles.verifiedLine}>
              <MaterialIcons
                name="verified-user"
                size={13}
                color={colors.textSecondary}
              />
              <Text style={styles.verifiedText}>
                İletişim bilgisi doğrulandı
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.interestsSection}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Seni neler heyecanlandırır?</Text>
            <Pressable
              testID="profile-interests-edit"
              accessibilityRole="button"
              accessibilityLabel="İlgi alanlarını düzenle"
              style={styles.smallAction}
              onPress={() => navigation.navigate("EditInterests")}
            >
              <MaterialIcons
                name="north-east"
                size={20}
                color={colors.textPrimary}
              />
            </Pressable>
          </View>
          {user.interests.length > 0 ? (
            <View style={styles.interestsRow}>
              {user.interests.map((interest) => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>
                    {CATEGORY_EMOJI[interest] ?? "✦"} {interest}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Pressable
              testID="profile-add-interests"
              accessibilityRole="button"
              onPress={() => navigation.navigate("EditInterests")}
              style={styles.addInterests}
            >
              <View style={styles.addInterestIcon}>
                <MaterialIcons
                  name="add"
                  size={19}
                  color={colors.textSecondary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.interestText}>İlgi alanlarını seç</Text>
                <Text style={styles.caption}>
                  Sana uygun planları birlikte bulalım.
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.membership}>
          <View pointerEvents="none" style={styles.membershipOrbit} />
          <View style={styles.membershipTop}>
            <View style={styles.membershipBrand}>
              <MaterialIcons name="auto-awesome" size={18} color="#E9C3A4" />
              <Text style={styles.membershipLabel}>KATIL PREMIUM</Text>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>
                {user.isPremium ? "Aktif" : "Ücretsiz plan"}
              </Text>
            </View>
          </View>
          <Text style={styles.membershipTitle}>
            {user.isPremium
              ? "Yeni planlara sınırsız keşif."
              : "Biraz daha keşfet."}
          </Text>
          <Text style={styles.membershipBody}>
            {user.isPremium
              ? "Mesafe sınırı olmadan keşfet, ayda 10 katılım isteği gönder."
              : "Mesafe sınırı olmadan keşif ve daha fazla katılım hakkı."}
          </Text>
          {isTrialEligible ? (
            <Button
              testID="profile-start-trial-button"
              title="1 ay ücretsiz dene"
              icon="arrow-forward"
              onPress={handleStartTrial}
              loading={isStartingTrial}
              style={styles.trialButton}
            />
          ) : (
            <Text style={styles.membershipFootnote}>
              {user.isPremium
                ? user.premiumTrialEndsAt
                  ? "Deneme bitişi: " +
                    new Date(user.premiumTrialEndsAt).toLocaleDateString(
                      "tr-TR",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : "Premium ayrıcalıkların kullanıma hazır."
                : "Deneme hakkını daha önce kullandın."}
            </Text>
          )}
          {trialError ? (
            <Text accessibilityRole="alert" style={styles.trialError}>
              {trialError}
            </Text>
          ) : null}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.groupLabel}>SANA GÖRE</Text>
          <SettingsRow
            testID="profile-personal-info-row"
            icon="person-outline"
            title="Kişisel bilgiler"
            subtitle="Seni tanıyalım"
            onPress={() => navigation.navigate("EditPersonalInfo")}
          />
          <SettingsRow
            testID="profile-preferences-row"
            icon="tune"
            title="Tercihler"
            subtitle="İlgi alanların ve konumun"
            onPress={() => navigation.navigate("Preferences")}
          />
          <SettingsRow
            testID="profile-notifications-row"
            icon="notifications-none"
            title="Bildirimler"
            subtitle="Hangi konularda haber almak istersin?"
            onPress={() => navigation.navigate("Notifications")}
            showDivider={false}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.groupLabel}>GÜVENLİK VE GİZLİLİK</Text>
          <ToggleRow
            testID="profile-biometric-toggle"
            icon="fingerprint"
            title="Biyometrik kilit"
            subtitle={
              biometricAvailable
                ? "Açılışta Face ID veya Touch ID kullan"
                : "Bu cihazda kullanılamıyor"
            }
            value={biometricEnabled}
            onValueChange={handleToggleBiometric}
            disabled={!biometricAvailable}
          />
          {biometricError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {biometricError}
            </Text>
          ) : null}
          <SettingsRow
            testID="profile-legal-row"
            icon="shield"
            title="Gizlilik ve yasal"
            subtitle="Verilerin ve hakların"
            onPress={() => navigation.navigate("Legal")}
            showDivider={false}
          />
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.groupLabel}>HESAP İŞLEMLERİ</Text>
          <SettingsRow
            testID="profile-logout-row"
            icon="logout"
            title="Çıkış yap"
            onPress={() => setShowLogoutConfirm(true)}
          />
          <SettingsRow
            testID="profile-delete-account-row"
            icon="delete-outline"
            title="Hesabı sil"
            subtitle="Hesabını ve ilişkili verilerini kalıcı olarak sil"
            tone="danger"
            showDivider={false}
            onPress={() => {
              setDeleteError(null);
              setShowDeleteConfirm(true);
            }}
          />
        </View>
        <View style={styles.signoff}>
          <Text style={styles.signoffBrand}>
            katıl<Text style={{ color: colors.primary }}>.</Text>
          </Text>
          <Text style={styles.caption}>Biraz dışarı, biraz birlikte.</Text>
        </View>

        <Modal
          visible={showLogoutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.overlay}>
            <Card style={styles.logoutCard}>
              <MaterialIcons name="logout" size={40} color={colors.error} />
              <Text style={styles.logoutTitle}>Çıkış Yap</Text>
              <Text style={styles.logoutBody}>
                Hesabından çıkış yapmak istediğine emin misin?
              </Text>
              <View style={styles.logoutActions}>
                <Button
                  testID="profile-logout-cancel-button"
                  variant="outline"
                  title="İptal"
                  onPress={() => setShowLogoutConfirm(false)}
                  style={styles.logoutActionButton}
                />
                <Button
                  testID="profile-logout-confirm-button"
                  title="Çıkış Yap"
                  onPress={() => logout()}
                  style={styles.logoutActionButton}
                />
              </View>
            </Card>
          </View>
        </Modal>

        <Modal
          visible={showDeleteConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteConfirm(false)}
        >
          <View style={styles.overlay}>
            <Card style={styles.logoutCard}>
              <MaterialIcons
                name="delete-forever"
                size={40}
                color={colors.error}
              />
              <Text style={styles.logoutTitle}>Hesabı Kalıcı Olarak Sil</Text>
              <Text style={styles.logoutBody}>
                Profilin, oluşturduğun etkinlikler, katılımların ve
                değerlendirmelerin silinir. Bu işlem geri alınamaz.
              </Text>
              {deleteError ? (
                <Text style={styles.error}>{deleteError}</Text>
              ) : null}
              <View style={styles.logoutActions}>
                <Button
                  testID="profile-delete-account-cancel-button"
                  variant="outline"
                  title="Vazgeç"
                  onPress={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  style={styles.logoutActionButton}
                />
                <Button
                  testID="profile-delete-account-confirm-button"
                  title={isDeleting ? "Siliniyor..." : "Hesabı Sil"}
                  onPress={handleDeleteAccount}
                  disabled={isDeleting}
                  style={styles.logoutActionButton}
                />
              </View>
            </Card>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 24, gap: 28 },
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -1,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  editPill: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
  },
  editPillText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: colors.textPrimary,
  },
  identity: {
    gap: 14,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  identityTop: { flexDirection: "row", alignItems: "center", gap: 18 },
  identityText: { flex: 1, gap: 5 },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 1.4,
    color: colors.textMuted,
  },
  avatarWrapper: {
    padding: 5,
    borderWidth: 1,
    borderColor: "#CED7C5",
    borderRadius: 999,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: colors.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 26,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  verifiedBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "DMSans_700Bold",
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.6,
    color: colors.textPrimary,
  },
  email: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  bio: { ...typography.bodyMd, color: colors.textSecondary, lineHeight: 23 },
  verifiedLine: { flexDirection: "row", alignItems: "center", gap: 5 },
  verifiedText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: colors.textSecondary,
  },
  interestsSection: { gap: 10 },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.4,
    color: colors.textPrimary,
    flex: 1,
  },
  smallAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  interestsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    maxWidth: "100%",
  },
  interestText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  addInterests: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
    minHeight: 52,
  },
  addInterestIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  membership: {
    backgroundColor: colors.textPrimary,
    borderRadius: 22,
    padding: 20,
    gap: 12,
    overflow: "hidden",
  },
  membershipOrbit: {
    position: "absolute",
    width: 210,
    height: 210,
    borderWidth: 1,
    borderColor: "#515B4C",
    borderRadius: 105,
    right: -115,
    top: 22,
  },
  membershipTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  membershipBrand: { flexDirection: "row", alignItems: "center", gap: 7 },
  membershipLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.1,
    color: "#E9C3A4",
  },
  planBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#41483F",
  },
  planBadgeText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 10,
    color: "#E4E8DF",
  },
  membershipTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.7,
    color: colors.onPrimary,
  },
  membershipBody: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: "#D0D6CA",
    maxWidth: 270,
  },
  trialButton: { marginTop: 4 },
  membershipFootnote: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    lineHeight: 18,
    color: "#E9C3A4",
  },
  trialError: { ...typography.bodyMd, color: "#FFDAD6" },
  settingsSection: { gap: 2 },
  groupLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: 8,
  },
  signoff: { alignItems: "center", gap: 5, paddingVertical: 4 },
  signoffBrand: {
    fontFamily: "DMSans_800ExtraBold",
    fontSize: 25,
    letterSpacing: -1.2,
    color: colors.textPrimary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(36,42,38,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  logoutCard: {
    width: "100%",
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: 24,
  },
  logoutTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    textAlign: "center",
  },
  logoutBody: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: "center",
  },
  logoutActions: {
    flexDirection: "row",
    gap: spacing.xs,
    width: "100%",
    marginTop: spacing.xs,
  },
  logoutActionButton: { flex: 1 },
  error: { ...typography.bodyMd, color: colors.error, textAlign: "center" },
});
