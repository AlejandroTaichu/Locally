import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Button from './Button';
import Card from './Card';
import { colors, radii, spacing, typography } from '../theme';

interface TrialOfferModalProps {
  visible: boolean;
  hasAccepted: boolean;
  isSubmitting: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function TrialOfferModal({ visible, hasAccepted, isSubmitting, onAccept, onDismiss }: TrialOfferModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <MaterialIcons name="card-giftcard" size={48} color={colors.primary} />

          {hasAccepted ? (
            <>
              <Text style={styles.title}>1 ay ücretsiz!</Text>
              <Text style={styles.body}>İptal etmezsen 2. ayda ücret alınacak. Dilediğin zaman 1. ay dolmadan iptal edebilirsin.</Text>
              <Button testID="trial-offer-done-button" title="Tamam" onPress={onDismiss} style={styles.button} />
            </>
          ) : (
            <>
              <Text style={styles.title}>Daha fazlasından yararlan</Text>
              <Text style={styles.body}>
                1 aylık ücretsiz premium denemek ister misin? Sınırsız keşif ve daha yüksek katılım hakkı kazanırsın.
              </Text>
              <Button
                testID="trial-offer-accept-button"
                title={isSubmitting ? '...' : 'Evet, Dene'}
                onPress={onAccept}
                disabled={isSubmitting}
                style={styles.button}
              />
              <Text testID="trial-offer-decline-button" style={styles.declineLink} onPress={onDismiss}>
                Hayır, İstemiyorum
              </Text>
            </>
          )}
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
    textAlign: 'center',
  },
  body: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginTop: spacing.xs,
  },
  declineLink: {
    ...typography.bodyMd,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
});
