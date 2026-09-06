import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { updateMe } from '../../api/users';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import InterestsGrid from '../../components/InterestsGrid';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EditInterests'>;

const MAX_INTERESTS = 3;

export default function EditInterestsScreen({ navigation }: Props) {
  const { user, token, refreshUser } = useAuth();
  const [selected, setSelected] = useState<string[]>(user?.interests ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateMe({ interests: selected }, token);
      await refreshUser();
      navigation.goBack();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.hint}>Sana uygun etkinlikleri bulmamız için en fazla {MAX_INTERESTS} ilgi alanı seç.</Text>
        <InterestsGrid selected={selected} onChange={setSelected} max={MAX_INTERESTS} />
      </ScrollView>
      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button testID="interests-save-button" title={saving ? '...' : 'Kaydet'} onPress={handleSave} disabled={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  hint: {
    ...typography.bodyMd,
    color: colors.textSecondary,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
