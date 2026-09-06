import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import Chip from '../../components/Chip';
import Stepper from '../../components/Stepper';
import { colors, radii, spacing, typography } from '../../theme';

type Gender = 'male' | 'female';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
];

interface ProfileStepProps {
  age: number;
  onAgeChange: (age: number) => void;
  bio: string;
  onBioChange: (bio: string) => void;
  username: string;
  onUsernameChange: (username: string) => void;
  gender: Gender | null;
  onGenderChange: (gender: Gender | null) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2);
  return (initials ?? '').toUpperCase();
}

export default function ProfileStep({
  age,
  onAgeChange,
  bio,
  onBioChange,
  username,
  onUsernameChange,
  gender,
  onGenderChange,
}: ProfileStepProps) {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profilini tamamla</Text>
      <Text style={styles.subtitle}>Kiminle oynadığını çevrendekiler bilsin.</Text>

      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user ? getInitials(user.displayName) : ''}</Text>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Yaş</Text>
        <Stepper testID="onboarding-age-stepper" value={age} onChange={onAgeChange} min={13} max={99} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Kısa Bio (opsiyonel)</Text>
        <TextInput
          testID="onboarding-bio-input"
          style={styles.bioInput}
          placeholder="Hafta sonları eğlenmek için oynarım..."
          placeholderTextColor={colors.textMuted}
          value={bio}
          onChangeText={onBioChange}
          multiline
          maxLength={280}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Kullanıcı Adı (opsiyonel)</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.usernamePrefix}>@</Text>
          <TextInput
            testID="onboarding-username-input"
            style={styles.usernameInput}
            placeholder="kullaniciadi"
            placeholderTextColor={colors.textMuted}
            value={username}
            onChangeText={(value) => onUsernameChange(value.toLowerCase())}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Cinsiyet (opsiyonel)</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              testID={`onboarding-gender-chip-${option.value}`}
              label={option.label}
              selected={gender === option.value}
              onPress={() => onGenderChange(gender === option.value ? null : option.value)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  title: { ...typography.headlineMd, color: colors.textPrimary },
  subtitle: { ...typography.bodyMd, color: colors.textSecondary, marginBottom: spacing.xs },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.sm },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radii.avatar,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.headlineMd, color: colors.textPrimary },
  field: { gap: spacing.xs },
  chipRow: { flexDirection: 'row', gap: spacing.xs },
  label: { ...typography.labelCaps, color: colors.textMuted },
  bioInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    padding: spacing.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.bodyMd,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
  },
  usernamePrefix: {
    ...typography.bodyMd,
    color: colors.textMuted,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    color: colors.textPrimary,
    ...typography.bodyMd,
  },
});
