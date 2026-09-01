import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { updateMe } from '../../api/users';
import Button from '../../components/Button';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export default function ProfileScreen({}: Props) {
  const { user, token, logout, refreshUser } = useAuth();
  const [isTogglingPremium, setIsTogglingPremium] = useState(false);

  async function handleTogglePremium() {
    if (!token || !user) return;
    setIsTogglingPremium(true);
    try {
      await updateMe({ isPremium: !user.isPremium }, token);
      await refreshUser();
    } finally {
      setIsTogglingPremium(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Ad Soyad</Text>
          <Text style={styles.value}>{user.displayName}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>E-posta</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Telefon</Text>
          <Text style={styles.value}>{user.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Üyelik</Text>
        <Text style={styles.mutedText}>
          {user.isPremium
            ? 'Premium hesabınla tüm etkinlikleri (mesafe sınırı olmadan) görebiliyorsun.'
            : 'Ücretsiz hesapla sadece yakın çevrendeki etkinlikleri görüyorsun.'}
        </Text>
        <Button
          testID="profile-premium-toggle"
          variant={user.isPremium ? 'primary' : 'outline'}
          title={isTogglingPremium ? '...' : user.isPremium ? '⭐ Premium (kapatmak için dokun)' : 'Ücretsiz (premium için dokun)'}
          onPress={handleTogglePremium}
          disabled={isTogglingPremium}
        />
      </View>

      <Button testID="profile-logout-button" variant="outline" title="Çıkış Yap" onPress={() => logout()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  label: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  value: {
    ...typography.bodyLg,
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
});
