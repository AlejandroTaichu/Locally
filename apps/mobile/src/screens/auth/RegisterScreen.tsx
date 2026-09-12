import { useState } from "react";
import { Keyboard, Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { register } from "../../api/auth";
import { ApiError } from "../../api/client";
import Button from "../../components/Button";
import { colors } from "../../theme";
import AuthLayout, { authStyles as styles } from "./AuthLayout";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;
export default function RegisterScreen({ navigation }: Props) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit() {
    if (isSubmitting) return;
    Keyboard.dismiss();
    setError(null);
    if (!displayName.trim() || !email.trim() || !phone.trim() || !password) {
      setError("Tüm alanları doldur");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı");
      return;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        displayName: displayName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      // Registration already sends the email OTP; do not request it twice.
      navigation.navigate("OtpVerify", {
        channel: "email",
        target: email.trim().toLowerCase(),
      });
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
      eyebrow="ARAMIZA HOŞ GELDİN"
      title={"Birlikte daha\ngüzel."}
      subtitle="İlk adım tanışmak. Sonrası yeni insanlar, yeni planlar."
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Adın ve soyadın</Text>
          <TextInput
            testID="register-name-input"
            accessibilityLabel="Adın ve soyadın"
            style={styles.input}
            placeholder="Sana nasıl seslenelim?"
            placeholderTextColor={colors.textMuted}
            textContentType="name"
            autoCapitalize="words"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>E-posta adresin</Text>
          <TextInput
            testID="register-email-input"
            accessibilityLabel="E-posta adresin"
            style={styles.input}
            placeholder="ornek@mail.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Telefon numaran</Text>
          <TextInput
            testID="register-phone-input"
            accessibilityLabel="Telefon numaran"
            style={styles.input}
            placeholder="+90 5xx xxx xx xx"
            placeholderTextColor={colors.textMuted}
            textContentType="telephoneNumber"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            editable={!isSubmitting}
          />
          <Text style={styles.hint}>
            Ülke koduyla birlikte yaz. Örneğin +90.
          </Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Şifre</Text>
          <TextInput
            testID="register-password-input"
            accessibilityLabel="Şifre"
            style={styles.input}
            placeholder="En az 8 karakter"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            textContentType="newPassword"
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            editable={!isSubmitting}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Şifre tekrar</Text>
          <TextInput
            testID="register-confirm-password-input"
            accessibilityLabel="Şifre tekrar"
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
          testID="register-submit-button"
          title="Hesabımı oluştur"
          icon="north-east"
          onPress={handleSubmit}
          loading={isSubmitting}
        />
        <Text style={styles.hint}>
          Devamında e-postana göndereceğimiz kodla hesabını doğrulayacağız.
        </Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Zaten hesabın var mı?</Text>
        <Pressable
          accessibilityRole="button"
          testID="register-login-link"
          style={styles.linkButton}
          disabled={isSubmitting}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.link}>Giriş yap</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
