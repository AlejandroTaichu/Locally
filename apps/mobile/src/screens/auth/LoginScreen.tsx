import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { requestOtp } from '../../api/auth';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import FadeSlideIn from '../../components/FadeSlideIn';
import { colors, motion, radii, spacing, typography } from '../../theme';

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
      >
        <FadeSlideIn delay={0} style={styles.fullWidth}>
          <Text style={styles.title}>Katıl</Text>
          <Text style={styles.loginTitle}>Giriş Yap</Text>
          <Text style={styles.subtitle}>E-posta veya telefon ile giriş yap</Text>
        </FadeSlideIn>

        <FadeSlideIn delay={motion.stagger.step} style={styles.fullWidth}>
          <TextInput
            testID="login-target-input"
            style={styles.input}
            placeholder="ornek@mail.com veya +90..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={target}
            onChangeText={setTarget}
          />
        </FadeSlideIn>

        {error ? (
          <FadeSlideIn delay={0} distance={4} style={styles.fullWidth}>
            <Text style={styles.error}>{error}</Text>
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={motion.stagger.step * 2} style={styles.fullWidth}>
          <Button
            testID="login-submit-button"
            title={isSubmitting ? 'Gönderiliyor...' : 'Kod Gönder'}
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitButton}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={motion.stagger.step * 3}>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Hesabın yok mu? </Text>
            <Text testID="login-register-link" style={styles.link} onPress={() => navigation.navigate('Register')}>
              Kayıt ol
            </Text>
          </View>
        </FadeSlideIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  title: {
    ...typography.displayMobile,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  loginTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
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
