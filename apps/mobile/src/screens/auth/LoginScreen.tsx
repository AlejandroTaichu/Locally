import { useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { login } from "../../api/auth";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/Button";
import { colors } from "../../theme";
import AuthLayout, { authStyles as styles } from "./AuthLayout";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;
export default function LoginScreen({ navigation }: Props) {
  const { login: setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit() {
    if (isSubmitting) return;
    Keyboard.dismiss();
    setError(null);
    if (!email.trim() || !password) {
      setError("E-posta ve şifreni gir");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login({ email: email.trim(), password });
      await setSession(result);
      // AuthProvider state change automatically switches RootNavigator to the app stack.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Bir şeyler ters gitti");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <AuthLayout
      artwork
      eyebrow="YENİDEN MERHABA"
      title={"Güzel planlar,\nseni bekliyor."}
      subtitle="Hesabına giriş yap, kaldığın yerden birlikte devam edelim."
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            testID="login-email-input"
            accessibilityLabel="E-posta"
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Şifre</Text>
          <TextInput
            testID="login-password-input"
            accessibilityLabel="Şifre"
            style={styles.input}
            placeholder="Şifreni gir"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            textContentType="password"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
            editable={!isSubmitting}
          />
        </View>
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <Button
          testID="login-submit-button"
          title="Giriş yap"
          icon="arrow-forward"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
        <Pressable
          testID="login-forgot-password-link"
          accessibilityRole="button"
          style={styles.linkButton}
          disabled={isSubmitting}
          onPress={() => navigation.navigate("ForgotPassword")}
        >
          <Text style={styles.link}>Şifremi unuttum</Text>
        </Pressable>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Henüz tanışmadık mı?</Text>
        <Pressable
          testID="login-register-link"
          accessibilityRole="button"
          style={styles.linkButton}
          disabled={isSubmitting}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.link}>Aramıza katıl</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
