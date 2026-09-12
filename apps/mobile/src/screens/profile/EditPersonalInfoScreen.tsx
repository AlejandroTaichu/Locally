import { useState } from 'react';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { requestEmailChange, requestPhoneChange, updateMe, verifyEmailChange, verifyPhoneChange } from '../../api/users';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import Stepper from '../../components/Stepper';
import { colors, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EditPersonalInfo'>;

type FieldKey = 'displayName' | 'username' | 'age' | 'gender' | 'bio' | 'email' | 'phone';
type Gender = 'male' | 'female';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
];

export default function EditPersonalInfoScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, token, refreshUser } = useAuth();

  const [editingField, setEditingField] = useState<FieldKey | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [ageDraft, setAgeDraft] = useState(25);
  const [genderDraft, setGenderDraft] = useState<Gender | null>(null);
  const [codeDraft, setCodeDraft] = useState('');
  const [contactStage, setContactStage] = useState<'target' | 'code'>('target');
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  function startEdit(field: FieldKey) {
    if (!user) return;
    setFieldError(null);
    setContactStage('target');
    setCodeDraft('');
    switch (field) {
      case 'displayName':
        setTextDraft(user.displayName);
        break;
      case 'username':
        setTextDraft(user.username ?? '');
        break;
      case 'bio':
        setTextDraft(user.bio ?? '');
        break;
      case 'age':
        setAgeDraft(user.age ?? 25);
        break;
      case 'gender':
        setGenderDraft(user.gender);
        break;
      case 'email':
      case 'phone':
        setTextDraft('');
        break;
    }
    setEditingField(field);
  }

  function cancelEdit() {
    setEditingField(null);
    setFieldError(null);
  }

  async function saveSimpleField(field: 'displayName' | 'username' | 'bio', value: string) {
    if (!token) return;
    setSaving(true);
    setFieldError(null);
    try {
      await updateMe({ [field]: value.trim() }, token);
      await refreshUser();
      setEditingField(null);
    } catch (err) {
      setFieldError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSaving(false);
    }
  }

  async function saveAge() {
    if (!token) return;
    setSaving(true);
    setFieldError(null);
    try {
      await updateMe({ age: ageDraft }, token);
      await refreshUser();
      setEditingField(null);
    } catch (err) {
      setFieldError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSaving(false);
    }
  }

  async function saveGender() {
    if (!token || genderDraft === null) return;
    setSaving(true);
    setFieldError(null);
    try {
      await updateMe({ gender: genderDraft }, token);
      await refreshUser();
      setEditingField(null);
    } catch (err) {
      setFieldError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSaving(false);
    }
  }

  async function handleSendCode(channel: 'email' | 'phone') {
    if (!token) return;
    const target = textDraft.trim();
    setSaving(true);
    setFieldError(null);
    try {
      if (channel === 'email') {
        await requestEmailChange(target.toLowerCase(), token);
      } else {
        await requestPhoneChange(target, token);
      }
      setContactStage('code');
    } catch (err) {
      setFieldError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyCode(channel: 'email' | 'phone') {
    if (!token) return;
    const target = textDraft.trim();
    setSaving(true);
    setFieldError(null);
    try {
      if (channel === 'email') {
        await verifyEmailChange(target.toLowerCase(), codeDraft.trim(), token);
      } else {
        await verifyPhoneChange(target, codeDraft.trim(), token);
      }
      await refreshUser();
      setEditingField(null);
    } catch (err) {
      setFieldError(err instanceof ApiError ? err.message : 'Bir şeyler ters gitti');
    } finally {
      setSaving(false);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Geri"
          testID="edit-personal-info-back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Kişisel bilgiler</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <EditableRow
          label="Ad Soyad"
          value={user.displayName}
          field="displayName"
          editingField={editingField}
          onEdit={() => startEdit('displayName')}
          onCancel={cancelEdit}
          onPrimary={() => saveSimpleField('displayName', textDraft)}
          primaryLabel="Kaydet"
          saving={saving}
          error={fieldError}
        >
          <TextInput
            testID="profile-input-displayName"
            style={styles.textInput}
            value={textDraft}
            onChangeText={setTextDraft}
            placeholder="Ad Soyad"
            placeholderTextColor={colors.textMuted}
          />
        </EditableRow>

        <EditableRow
          label="Kullanıcı Adı"
          value={user.username ? `@${user.username}` : '—'}
          field="username"
          editingField={editingField}
          onEdit={() => startEdit('username')}
          onCancel={cancelEdit}
          onPrimary={() => saveSimpleField('username', textDraft)}
          primaryLabel="Kaydet"
          saving={saving}
          error={fieldError}
        >
          <View style={styles.usernameRow}>
            <Text style={styles.usernamePrefix}>@</Text>
            <TextInput
              testID="profile-input-username"
              style={styles.usernameInput}
              value={textDraft}
              onChangeText={(value) => setTextDraft(value.toLowerCase())}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              placeholder="kullaniciadi"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </EditableRow>

        <EditableRow
          label="E-posta"
          value={user.email}
          field="email"
          editingField={editingField}
          onEdit={() => startEdit('email')}
          onCancel={cancelEdit}
          onPrimary={() => (contactStage === 'target' ? handleSendCode('email') : handleVerifyCode('email'))}
          primaryLabel={contactStage === 'target' ? 'Kod Gönder' : 'Onayla'}
          saving={saving}
          error={fieldError}
        >
          {contactStage === 'target' ? (
            <TextInput
              testID="profile-input-email"
              style={styles.textInput}
              value={textDraft}
              onChangeText={setTextDraft}
              placeholder="Yeni e-posta adresi"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          ) : (
            <TextInput
              testID="profile-email-code-input"
              style={styles.codeInput}
              value={codeDraft}
              onChangeText={setCodeDraft}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}
        </EditableRow>

        <EditableRow
          label="Telefon"
          value={user.phone}
          field="phone"
          editingField={editingField}
          onEdit={() => startEdit('phone')}
          onCancel={cancelEdit}
          onPrimary={() => (contactStage === 'target' ? handleSendCode('phone') : handleVerifyCode('phone'))}
          primaryLabel={contactStage === 'target' ? 'Kod Gönder' : 'Onayla'}
          saving={saving}
          error={fieldError}
        >
          {contactStage === 'target' ? (
            <TextInput
              testID="profile-input-phone"
              style={styles.textInput}
              value={textDraft}
              onChangeText={setTextDraft}
              placeholder="Yeni telefon numarası"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          ) : (
            <TextInput
              testID="profile-phone-code-input"
              style={styles.codeInput}
              value={codeDraft}
              onChangeText={setCodeDraft}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}
        </EditableRow>

        <EditableRow
          label="Yaş"
          value={user.age != null ? String(user.age) : '—'}
          field="age"
          editingField={editingField}
          onEdit={() => startEdit('age')}
          onCancel={cancelEdit}
          onPrimary={saveAge}
          primaryLabel="Kaydet"
          saving={saving}
          error={fieldError}
        >
          <Stepper testID="profile-age-stepper" value={ageDraft} onChange={setAgeDraft} min={13} max={99} />
        </EditableRow>

        <EditableRow
          label="Cinsiyet"
          value={user.gender ? (user.gender === 'female' ? 'Kadın' : 'Erkek') : '—'}
          field="gender"
          editingField={editingField}
          onEdit={() => startEdit('gender')}
          onCancel={cancelEdit}
          onPrimary={saveGender}
          primaryLabel="Kaydet"
          primaryDisabled={genderDraft === null}
          saving={saving}
          error={fieldError}
        >
          <View style={styles.pillRow}>
            {GENDER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                testID={`profile-gender-chip-${option.value}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: genderDraft === option.value }}
                style={[styles.pill, genderDraft === option.value && styles.pillSelected]}
                onPress={() => setGenderDraft(genderDraft === option.value ? null : option.value)}
              >
                <Text style={[styles.pillLabel, genderDraft === option.value && styles.pillLabelSelected]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </EditableRow>

        <EditableRow
          label="Bio"
          value={user.bio ?? '—'}
          field="bio"
          editingField={editingField}
          onEdit={() => startEdit('bio')}
          onCancel={cancelEdit}
          onPrimary={() => saveSimpleField('bio', textDraft)}
          primaryLabel="Kaydet"
          saving={saving}
          error={fieldError}
          isLast
        >
          <TextInput
            testID="profile-input-bio"
            style={styles.bioInput}
            value={textDraft}
            onChangeText={setTextDraft}
            placeholder="Hafta sonları eğlenmek için oynarım..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={280}
          />
        </EditableRow>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface EditableRowProps {
  label: string;
  value: string;
  field: FieldKey;
  editingField: FieldKey | null;
  onEdit: () => void;
  onCancel: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  saving: boolean;
  error: string | null;
  children: ReactNode;
  isLast?: boolean;
}

function EditableRow({
  label,
  value,
  field,
  editingField,
  onEdit,
  onCancel,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  saving,
  error,
  children,
  isLast,
}: EditableRowProps) {
  const isEditing = editingField === field;

  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={styles.rowHeader}>
        <Text style={styles.label}>{label}</Text>
        {isEditing ? (
          <Pressable
            testID={`profile-cancel-${field}`}
            accessibilityRole="button"
            accessibilityLabel="Vazgeç"
            onPress={onCancel}
            disabled={saving}
            style={styles.rowIconButton}
          >
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Pressable
            testID={`profile-edit-${field}`}
            accessibilityRole="button"
            accessibilityLabel={`${label} — düzenle`}
            onPress={onEdit}
            style={styles.rowIconButton}
          >
            <MaterialIcons name="edit" size={16} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {isEditing ? (
        <View style={styles.rowEditContent}>
          {children}
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <Button
            testID={`profile-save-${field}`}
            title={saving ? '...' : primaryLabel}
            onPress={onPrimary}
            disabled={saving || primaryDisabled}
          />
        </View>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.textPrimary,
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    paddingVertical: 15,
    gap: 8,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  rowEditContent: {
    gap: spacing.sm,
    paddingTop: 4,
  },
  label: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  value: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillSelected: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  pillLabel: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
  },
  pillLabelSelected: {
    color: colors.onPrimary,
  },
  textInput: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainer,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  bioInput: {
    minHeight: 100,
    borderRadius: 16,
    padding: spacing.md,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceContainer,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  codeInput: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainer,
    textAlign: 'center',
    fontFamily: 'DMSans_700Bold',
    fontSize: 20,
    letterSpacing: 6,
    color: colors.textPrimary,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing.md,
  },
  usernamePrefix: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.textMuted,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
  },
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
