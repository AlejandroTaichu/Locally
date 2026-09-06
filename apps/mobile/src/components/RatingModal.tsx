import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from './Button';
import Card from './Card';
import { colors, radii, spacing, typography } from '../theme';

interface RatingModalProps {
  visible: boolean;
  eventTitle: string;
  isSubmitting: boolean;
  onSubmit: (score: number) => void;
  onDismiss: () => void;
}

export default function RatingModal({ visible, eventTitle, isSubmitting, onSubmit, onDismiss }: RatingModalProps) {
  const [score, setScore] = useState(0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <Text style={styles.title}>Nasıl geçti?</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {eventTitle}
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} testID={`rating-star-${value}`} onPress={() => setScore(value)} hitSlop={8}>
                <MaterialIcons name={value <= score ? 'star' : 'star-border'} size={40} color={colors.primary} />
              </Pressable>
            ))}
          </View>

          <Button
            testID="rating-submit-button"
            title={isSubmitting ? '...' : 'Gönder'}
            onPress={() => onSubmit(score)}
            disabled={score === 0 || isSubmitting}
            style={styles.button}
          />
          <Text testID="rating-dismiss-button" style={styles.laterLink} onPress={onDismiss}>
            Daha Sonra
          </Text>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11,28,48,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.card,
  },
  title: {
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  button: {
    width: '100%',
  },
  laterLink: {
    ...typography.bodyMd,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
