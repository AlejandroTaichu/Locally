import { StyleSheet, Text, View } from 'react-native';
import InterestsGrid from '../../components/InterestsGrid';
import { colors, spacing, typography } from '../../theme';

const MAX_INTERESTS = 3;

interface InterestsStepProps {
  selected: string[];
  onChange: (interests: string[]) => void;
}

export default function InterestsStep({ selected, onChange }: InterestsStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neyle ilgileniyorsun?</Text>
      <Text style={styles.subtitle}>Sana uygun etkinlikleri bulmamız için en fazla {MAX_INTERESTS} ilgi alanı seç.</Text>

      <InterestsGrid selected={selected} onChange={onChange} max={MAX_INTERESTS} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  title: { ...typography.headlineMd, color: colors.textPrimary },
  subtitle: { ...typography.bodyMd, color: colors.textSecondary },
});
