import { useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Button from "../../components/Button";
import { colors, spacing, typography } from "../../theme";

interface RegionBlockedScreenProps {
  reason: "permission-denied" | "unsupported-region" | "location-unavailable";
  onRetry: () => Promise<void>;
}

const COPY = {
  "permission-denied": {
    icon: "location-off" as const,
    title: "Konuma ihtiyacımız var",
    body: "Şehrini ve yakınındaki etkinlikleri göstermek için konumunu kullanıyoruz. İzin ekranında “Uygulamayı Kullanırken” seçersen her açılışta yeniden izin vermen gerekmez.",
  },
  "location-unavailable": {
    icon: "location-searching" as const,
    title: "Konumuna ulaşamadık",
    body: "Bu bir izin isteği değil. Konum servislerinin açık olduğundan emin ol ve tekrar dene.",
  },
  "unsupported-region": {
    icon: "explore-off" as const,
    title: "Henüz burada değiliz :(",
    body: "En kısa sürede seni de oyuna dahil edeceğiz!! Şu an sadece İstanbul, İzmir, Antalya ve Ankara'da kullanılabiliyoruz.",
  },
};

export default function RegionBlockedScreen({
  reason,
  onRetry,
}: RegionBlockedScreenProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const copy = COPY[reason];

  async function handleRetry() {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  }

  return (
    <View style={styles.container}>
      <MaterialIcons name={copy.icon} size={72} color={colors.textMuted} />
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.body}>{copy.body}</Text>

      {reason === "permission-denied" ? (
        <Button
          testID="region-open-settings-button"
          title="Ayarları Aç"
          icon="settings"
          onPress={() => Linking.openSettings()}
          style={styles.button}
        />
      ) : null}

      <Button
        testID="region-retry-button"
        variant={reason === "permission-denied" ? "outline" : "primary"}
        title="Tekrar Dene"
        icon="refresh"
        loading={isRetrying}
        onPress={handleRetry}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  body: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  button: {
    width: "100%",
  },
});
