import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EventArtwork from "../../components/EventArtwork";
import { colors } from "../../theme";

interface Props extends PropsWithChildren {
  title: string;
  subtitle: string;
  eyebrow: string;
  onBack?: () => void;
  artwork?: boolean;
}
export default function AuthLayout({
  title,
  subtitle,
  eyebrow,
  onBack,
  artwork,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={authStyles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[
          authStyles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
        ]}
      >
        <View style={authStyles.header}>
          {onBack ? (
            <Pressable
              testID="auth-back-button"
              accessibilityRole="button"
              accessibilityLabel="Geri"
              onPress={onBack}
              style={authStyles.back}
            >
              <MaterialIcons
                name="arrow-back"
                size={22}
                color={colors.textPrimary}
              />
            </Pressable>
          ) : null}
          <Text style={authStyles.brand}>
            katıl<Text style={authStyles.dot}>.</Text>
          </Text>
          <Text style={authStyles.slogan}>
            BİRAZ DIŞARI,{"\n"}BİRAZ BİRLİKTE.
          </Text>
        </View>
        {artwork ? (
          <View
            style={authStyles.artwork}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <EventArtwork category="Kahve/Sohbet Buluşması" style={{ height: 126 }} />
          </View>
        ) : null}
        <View style={authStyles.intro}>
          <Text style={authStyles.eyebrow}>{eyebrow}</Text>
          <Text accessibilityRole="header" style={authStyles.title}>
            {title}
          </Text>
          <Text style={authStyles.subtitle}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export const authStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24, gap: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontFamily: "DMSans_800ExtraBold",
    fontSize: 34,
    letterSpacing: -1.8,
    color: colors.textPrimary,
  },
  dot: { color: colors.primary },
  slogan: {
    flex: 1,
    textAlign: "right",
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 1.3,
    lineHeight: 14,
    color: colors.textSecondary,
  },
  artwork: { borderRadius: 22, overflow: "hidden" },
  intro: { gap: 12 },
  eyebrow: {
    fontFamily: "DMSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.primary,
  },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 33,
    lineHeight: 38,
    letterSpacing: -1.2,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  form: { gap: 18 },
  field: { gap: 9 },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  input: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surfaceContainer,
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: colors.textPrimary,
  },
  hint: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 16,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
  },
  noteText: {
    flex: 1,
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  error: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: colors.textSecondary,
  },
  linkButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 4 },
  link: { fontFamily: "DMSans_700Bold", fontSize: 14, color: colors.primary },
});
