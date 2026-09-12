import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../theme";
import { stepStyles } from "./createEventStepStyles";
import StepSection from "./StepSection";
import { CATEGORY_EMOJI } from "../../constants/eventCategories";

interface CreateEventBasicsStepProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  category: string | null;
  onOpenCategory: () => void;
}

export default function CreateEventBasicsStep({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  category,
  onOpenCategory,
}: CreateEventBasicsStepProps) {
  return (
    <View style={stepStyles.container}>
      <Text style={stepStyles.stepTitle}>İyi bir planla{"\n"}başlayalım.</Text>
      <Text style={stepStyles.stepSubtitle}>
        Aklındaki buluşmaya bir isim ver. Gerisi birlikte gelir.
      </Text>

      <StepSection label="Etkinliğin adı" icon="edit-note">
        <TextInput
          testID="event-title-input"
          accessibilityLabel="Etkinliğin adı"
          style={stepStyles.input}
          placeholder="Örn. 2'ye 2 Basketbol"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={onTitleChange}
        />
      </StepSection>
      <StepSection label="Plandan biraz bahset" trailing="İsteğe bağlı">
        <TextInput
          testID="event-description-input"
          accessibilityLabel="Etkinlik açıklaması"
          style={[stepStyles.input, stepStyles.textarea]}
          placeholder="Neler yapacaksınız? Yanımızda ne getirelim?"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={onDescriptionChange}
        />
      </StepSection>

      <StepSection label="Ne yapıyoruz?" icon="category">
        <Pressable
          accessibilityRole="button"
          testID="category-picker-row"
          onPress={onOpenCategory}
          style={styles.row}
        >
          <Text style={styles.emoji}>
            {category ? CATEGORY_EMOJI[category] : "✨"}
          </Text>
          <Text style={category ? styles.rowValue : styles.rowPlaceholder}>
            {category ?? "Bir kategori seç"}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </Pressable>
      </StepSection>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surfaceVariant,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowValue: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.textPrimary,
    fontWeight: "700",
    fontFamily: "DMSans_700Bold",
  },
  rowPlaceholder: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.textMuted,
  },
  emoji: { fontSize: 24 },
});
