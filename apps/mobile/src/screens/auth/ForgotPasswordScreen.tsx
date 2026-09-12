import { useState } from "react";
import { Keyboard, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { requestOtp } from "../../api/auth";
import { ApiError } from "../../api/client";
import Button from "../../components/Button";
import { colors } from "../../theme";
import AuthLayout, { authStyles as styles } from "./AuthLayout";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;
export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit() {
    if (isSubmitting) return;
    Keyboard.dismiss();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("E-posta adresini gir");
      return;
    }
    setIsSubmitting(true);
    try {
      await requestOtp({ channel: "email", target: trimmed });
      navigation.navigate("ResetPassword", { email: trimmed });
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
      eyebrow="ŞİFRENİ SIFIRLA"
      title={"Sana bir kod\ngönderelim."}
      subtitle="Hesabına kayıtlı e-posta adresini gir, doğrulama kodunu gönderelim."
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>E-posta</Text>
          <TextInput
            testID="forgot-password-email-input"
            accessibilityLabel="E-posta"
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="go"
            value={email}
            onChangeText={setEmail}
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
          testID="forgot-password-submit-button"
          title="Kod gönder"
          icon="arrow-forward"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
      </View>
    </AuthLayout>
  );
}
