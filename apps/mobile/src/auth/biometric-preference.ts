import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_LOCK_KEY = 'join-app.biometricLockEnabled';

export const biometricPreference = {
  get: async (): Promise<boolean> => {
    const raw = await SecureStore.getItemAsync(BIOMETRIC_LOCK_KEY);
    return raw === 'true';
  },
  set: (enabled: boolean) => SecureStore.setItemAsync(BIOMETRIC_LOCK_KEY, enabled ? 'true' : 'false'),
};
