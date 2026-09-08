import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { updateMe } from '../../api/users';
import type { UpdateMeInput } from '../../api/users';
import { ApiError } from '../../api/client';
import ToggleRow from '../../components/ToggleRow';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

type NotificationField = 'notifyEventReminders' | 'notifyNewParticipants' | 'notifyRecommendations';

export default function NotificationsScreen({}: Props) {
  const { user, token, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<NotificationField | null>(null);

  async function handleToggle(field: NotificationField, value: boolean) {
    if (!token) return;
    setError(null);
    setSavingField(field);
    try {
      await updateMe({ [field]: value } as UpdateMeInput, token);
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSavingField(null);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hint}>Hangi konularda bildirim almak istediğini seç.</Text>

      <ToggleRow
        testID="notifications-event-reminders-toggle"
        title="Etkinlik Hatırlatıcıları"
        subtitle="Katıldığın etkinlikler yaklaştığında haber ver"
        value={user.notifyEventReminders}
        onValueChange={(value) => handleToggle('notifyEventReminders', value)}
        disabled={savingField === 'notifyEventReminders'}
      />

      <ToggleRow
        testID="notifications-new-participants-toggle"
        title="Yeni Katılımcılar"
        subtitle="Etkinliğine biri katıldığında haber ver"
        value={user.notifyNewParticipants}
        onValueChange={(value) => handleToggle('notifyNewParticipants', value)}
        disabled={savingField === 'notifyNewParticipants'}
      />

      <ToggleRow
        testID="notifications-recommendations-toggle"
        title="Öneriler"
        subtitle="İlgi alanlarına uygun yeni etkinlikler için haber ver"
        value={user.notifyRecommendations}
        onValueChange={(value) => handleToggle('notifyRecommendations', value)}
        disabled={savingField === 'notifyRecommendations'}
        showDivider={false}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  hint: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  error: {
    ...typography.bodyMd,
    color: colors.error,
  },
});
