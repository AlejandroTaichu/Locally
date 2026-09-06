import { useState } from 'react';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../navigation/types';
import { useAuth } from '../../auth/AuthContext';
import { requestEmailChange, requestPhoneChange, updateMe, verifyEmailChange, verifyPhoneChange } from '../../api/users';
import { ApiError } from '../../api/client';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import Stepper from '../../components/Stepper';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AppStackParamList, 'EditPersonalInfo'>;

type FieldKey = 'displayName' | 'username' | 'age' | 'gender' | 'bio' | 'email' | 'phone';
type Gender = 'male' | 'female';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
];

export default function EditPersonalInfoScreen({}: Props) {
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
    <ScrollView contentContainerStyle={styles.container}>
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

        <View style={styles.divider} />
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

        <View style={styles.divider} />
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

        <View style={styles.divider} />
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

        <View style={styles.divider} />
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

        <View style={styles.divider} />
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
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                testID={`profile-gender-chip-${option.value}`}
                label={option.label}
                selected={genderDraft === option.value}
                onPress={() => setGenderDraft(genderDraft === option.value ? null : option.value)}
              />
            ))}
          </View>
        </EditableRow>

        <View style={styles.divider} />
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
}: EditableRowProps) {
  const isEditing = editingField === field;

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.label}>{label}</Text>
        {isEditing ? (
          <Pressable testID={`profile-cancel-${field}`} onPress={onCancel} hitSlop={8} disabled={saving}>
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Pressable testID={`profile-edit-${field}`} onPress={onEdit} hitSlop={8}>
            <MaterialIcons name="edit" size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {isEditing ? (
        <View style={styles.rowEditContent}>
          {children}
          {error ? <Text style={styles.error}>{error}</Text> : null}
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
  container: {
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: colors.background,
  },
  row: {
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowEditContent: {
    gap: spacing.xs,
    paddingTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  label: {
    ...typography.labelCaps,
    color: colors.textMuted,
  },
  value: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.bodyMd,
  },
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
  codeInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 6,
    color: colors.textPrimary,
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
  error: {
    color: colors.error,
    ...typography.bodyMd,
  },
});
