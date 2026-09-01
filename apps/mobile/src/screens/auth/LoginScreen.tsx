import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { requestOtp } from '../../api/auth';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function detectChannel(value: string): 'email' | 'phone' {
  return value.includes('@') ? 'email' : 'phone';
}

export default function LoginScreen({ navigation }: Props) {
  const [target, setTarget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    const trimmed = target.trim();
    if (!trimmed) {
      setError('E-posta veya telefon numaranı gir');
      return;
    }

    const channel = detectChannel(trimmed);
    setIsSubmitting(true);
    try {
      await requestOtp({ channel, target: trimmed });
      navigation.navigate('OtpVerify', { channel, target: trimmed });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Katıl</Text>
      <Text style={styles.subtitle}>E-posta veya telefon ile giriş yap</Text>

      <TextInput
        style={styles.input}
        placeholder="ornek@mail.com veya +90..."
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={target}
        onChangeText={setTarget}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title={isSubmitting ? 'Gönderiliyor...' : 'Kod Gönder'} onPress={handleSubmit} disabled={isSubmitting} style={styles.submitButton} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Hesabın yok mu? </Text>
        <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
          Kayıt ol
        </Text>
      </View>
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
  title: {
    ...typography.displayMobile,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.bodyLg,
  },
  submitButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
  footer: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  footerText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  link: {
    ...typography.bodyMd,
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
