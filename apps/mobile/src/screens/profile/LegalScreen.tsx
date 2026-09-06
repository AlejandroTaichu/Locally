import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text } from 'react-native';
import SettingsRow from '../../components/SettingsRow';
import { colors, spacing, typography } from '../../theme';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL;
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL;
const ACCOUNT_DELETION_URL = process.env.EXPO_PUBLIC_ACCOUNT_DELETION_URL;

export default function LegalScreen() {
  const [error, setError] = useState<string | null>(null);

  async function openDocument(url: string | undefined) {
    setError(null);
    if (!url) {
      setError('Bu bağlantı yayın ortamında henüz yapılandırılmamış.');
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      setError('Bağlantı açılamadı.');
      return;
    }
    await Linking.openURL(url);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.intro}>Verilerinin nasıl kullanıldığını ve hizmet kurallarını buradan inceleyebilirsin.</Text>
      <SettingsRow
        testID="legal-privacy-row"
        icon="privacy-tip"
        title="Gizlilik ve KVKK"
        subtitle="Toplanan veriler, kullanım amaçları ve hakların"
        onPress={() => openDocument(PRIVACY_POLICY_URL)}
      />
      <SettingsRow
        testID="legal-terms-row"
        icon="description"
        title="Kullanım Koşulları"
        subtitle="Katıl hizmetinin kullanım kuralları"
        onPress={() => openDocument(TERMS_URL)}
      />
      <SettingsRow
        testID="legal-account-deletion-row"
        icon="delete-outline"
        title="Web'den Hesap Silme"
        subtitle="Uygulamaya erişemiyorsan silme talebi oluştur"
        onPress={() => openDocument(ACCOUNT_DELETION_URL)}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  intro: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
});
