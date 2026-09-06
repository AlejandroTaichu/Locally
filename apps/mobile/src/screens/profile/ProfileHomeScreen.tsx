import { useLayoutEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList, AppTabParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { deleteMe, startTrial } from '../../api/users';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import Card from '../../components/Card';
import SettingsRow from '../../components/SettingsRow';
import { colors, radii, spacing, typography } from '../../theme';

type Props = CompositeScreenProps<BottomTabScreenProps<AppTabParamList, 'ProfilTab'>, NativeStackScreenProps<AppStackParamList>>;

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

export default function ProfileHomeScreen({ navigation }: Props) {
  const { user, token, logout, refreshUser } = useAuth();
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerTitle}>Profilim</Text>,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: colors.background },
      headerRight: () => (
        <Pressable
          testID="profile-edit-pill"
          style={styles.editPill}
          onPress={() => navigation.navigate('EditPersonalInfo')}
        >
          <Text style={styles.editPillText}>Düzenle</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  async function handleStartTrial() {
    if (!token) return;
    setIsStartingTrial(true);
    try {
      await startTrial(token);
      await refreshUser();
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
      setDeleteError(error instanceof ApiError ? error.message : 'Hesap silinemedi, lütfen tekrar dene');
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user) {
    return null;
  }

  const isTrialEligible = !user.isPremium && user.premiumTrialEndsAt === null;
  const isVerified = user.emailVerifiedAt != null || user.phoneVerifiedAt != null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.identity}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.displayName)}</Text>
          </View>
          {isVerified ? (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="check" size={12} color={colors.onPrimary} />
            </View>
          ) : null}
        </View>
        <Text style={styles.name}>{user.displayName}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <SettingsRow
        testID="profile-preferences-row"
        icon="tune"
        title="Tercihler"
        subtitle="İlgi alanların ve konumun"
        onPress={() => navigation.navigate('Preferences')}
      />

      <SettingsRow
        testID="profile-legal-row"
        icon="policy"
        title="Gizlilik ve Yasal"
        subtitle="Gizlilik metni, koşullar ve veri hakların"
        onPress={() => navigation.navigate('Legal')}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Üyelik</Text>
        <Text style={styles.mutedText}>
          {user.isPremium
            ? 'Premium hesabınla tüm etkinlikleri (mesafe sınırı olmadan) görebiliyorsun.'
            : 'Ücretsiz hesapla sadece yakın çevrendeki etkinlikleri görüyorsun.'}
        </Text>
        {isTrialEligible ? (
          <Button
            testID="profile-start-trial-button"
            title={isStartingTrial ? '...' : '1 Aylık Ücretsiz Denemeyi Başlat'}
            onPress={handleStartTrial}
            disabled={isStartingTrial}
          />
        ) : !user.isPremium ? (
          <Text style={styles.mutedText}>Deneme hakkını daha önce kullandın.</Text>
        ) : null}
      </View>

      <SettingsRow
        testID="profile-logout-row"
        icon="logout"
        title="Çıkış Yap"
        onPress={() => setShowLogoutConfirm(true)}
      />

      <SettingsRow
        testID="profile-delete-account-row"
        icon="delete-outline"
        title="Hesabı Sil"
        subtitle="Hesabını ve ilişkili verilerini kalıcı olarak sil"
        onPress={() => {
          setDeleteError(null);
          setShowDeleteConfirm(true);
        }}
      />

      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.overlay}>
          <Card style={styles.logoutCard}>
            <MaterialIcons name="logout" size={40} color={colors.error} />
            <Text style={styles.logoutTitle}>Çıkış Yap</Text>
            <Text style={styles.logoutBody}>Hesabından çıkış yapmak istediğine emin misin?</Text>
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

      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.overlay}>
          <Card style={styles.logoutCard}>
            <MaterialIcons name="delete-forever" size={40} color={colors.error} />
            <Text style={styles.logoutTitle}>Hesabı Kalıcı Olarak Sil</Text>
            <Text style={styles.logoutBody}>
              Profilin, oluşturduğun etkinlikler, katılımların ve değerlendirmelerin silinir. Bu işlem geri alınamaz.
            </Text>
            {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
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
                title={isDeleting ? 'Siliniyor...' : 'Hesabı Sil'}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                style={styles.logoutActionButton}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  editPill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.tag,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginRight: spacing.xs,
  },
  editPillText: {
    ...typography.labelCaps,
    textTransform: 'none',
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  identity: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  avatarWrapper: {
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radii.avatar,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: radii.avatar,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...typography.headlineSm,
    color: colors.textPrimary,
  },
  email: {
    ...typography.bodyMd,
    color: colors.textSecondary,
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11,28,48,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoutCard: {
    width: '100%',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoutTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  logoutBody: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  logoutActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    width: '100%',
    marginTop: spacing.xs,
  },
  logoutActionButton: {
    flex: 1,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
    textAlign: 'center',
  },
});
