import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import Button from '../../components/Button';
import { colors, radii, spacing, typography } from '../../theme';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

export default function BiometricLockScreen({ onUnlock }: BiometricLockScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function attemptUnlock() {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Katıl\'a devam etmek için kimliğini doğrula',
      });
      if (result.success) {
        onUnlock();
      } else {
        setError('Doğrulama tamamlanamadı, tekrar dene');
      }
    } finally {
      setIsAuthenticating(false);
    }
  }

  useEffect(() => {
    attemptUnlock();
    // Sadece ekran ilk açıldığında otomatik dene, sonraki denemeler kullanıcının "Tekrar Dene" basmasıyla olsun.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.iconBadge}>
        <MaterialIcons name="fingerprint" size={40} color={colors.primary} />
      </View>
      <Text style={styles.title}>Kilitli</Text>
      <Text style={styles.subtitle}>Devam etmek için Face ID/Touch ID ile doğrula</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        testID="biometric-lock-retry-button"
        title={isAuthenticating ? '...' : 'Tekrar Dene'}
        onPress={attemptUnlock}
        disabled={isAuthenticating}
        style={styles.retryButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: radii.avatar,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  retryButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
});
