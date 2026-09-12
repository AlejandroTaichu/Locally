import { useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { resetPassword } from "../../api/auth";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/Button";
import OtpCodeInput from "../../components/OtpCodeInput";
import { colors } from "../../theme";
import AuthLayout, { authStyles as styles } from "./AuthLayout";

type Props = NativeStackScreenProps<AuthStackParamList, "ResetPassword">;
export default function ResetPasswordScreen({ route, navigation }: Props) {
  const { email } = route.params;
  const { login: setSession } = useAuth();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit() {
    if (isSubmitting) return;
    Keyboard.dismiss();
    setError(null);
    if (code.trim().length !== 6) {
      setError("6 haneli kodu gir");
      return;
    }
    if (newPassword.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await resetPassword({ email, code: code.trim(), newPassword });
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
      onBack={() => {
        if (!isSubmitting) navigation.goBack();
      }}
      eyebrow="YENİ ŞİFRE"
      title={"Kodu ve yeni\nşifreni gir."}
      subtitle={`${email} adresine gönderilen 6 haneli kodu ve yeni şifreni gir.`}
    >
      <View style={styles.form}>
        <OtpCodeInput testID="reset-password-code-input" length={6} value={code} onChangeText={setCode} />
        <View style={styles.field}>
          <Text style={styles.label}>Yeni şifre</Text>
          <TextInput
            testID="reset-password-new-input"
            accessibilityLabel="Yeni şifre"
            style={styles.input}
            placeholder="En az 8 karakter"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            textContentType="newPassword"
            autoCapitalize="none"
            autoCorrect={false}
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Yeni şifre tekrar</Text>
          <TextInput
            testID="reset-password-confirm-input"
            accessibilityLabel="Yeni şifre tekrar"
            style={styles.input}
            placeholder="Şifreni tekrar gir"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            textContentType="newPassword"
            autoCapitalize="none"
            autoCorrect={false}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
          testID="reset-password-submit-button"
          title="Şifreyi güncelle"
          icon="check"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </View>
    </AuthLayout>
  );
}
