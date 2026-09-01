import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { requestOtp } from '../../api/auth';
import { ApiError } from '../../api/client';

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
        autoCapitalize="none"
        keyboardType="email-address"
        value={target}
        onChangeText={setTarget}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title={isSubmitting ? 'Gönderiliyor...' : 'Kod Gönder'} onPress={handleSubmit} disabled={isSubmitting} />

      <View style={styles.footer}>
        <Text>Hesabın yok mu? </Text>
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
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    color: '#c0392b',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  link: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
