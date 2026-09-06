import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { verifyOtp } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import Button from '../../components/Button';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerify'>;

export default function OtpVerifyScreen({ route }: Props) {
  const { channel, target } = route.params;
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (code.trim().length !== 6) {
      setError('6 haneli kodu gir');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyOtp({ channel, target, code: code.trim() });
      await login(result);
      // AuthProvider state change automatically switches RootNavigator to the app stack.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Doğrulama Kodu</Text>
      <Text style={styles.subtitle}>{target} adresine/numarasına gönderilen kodu gir</Text>

      <TextInput
        testID="otp-code-input"
        style={styles.input}
        placeholder="123456"
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        testID="otp-verify-button"
        title={isSubmitting ? 'Doğrulanıyor...' : 'Doğrula'}
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitButton}
      />
    </KeyboardAvoidingView>
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
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
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
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
    color: colors.textPrimary,
  },
  submitButton: {
    width: '100%',
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
