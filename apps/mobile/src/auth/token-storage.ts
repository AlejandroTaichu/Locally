import * as SecureStore from 'expo-secure-store';
import type { User } from '../api/auth';

const TOKEN_KEY = 'join-app.accessToken';
const USER_KEY = 'join-app.cachedUser';

export const tokenStorage = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clear: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
  getUser: async (): Promise<User | null> => {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  setUser: (user: User) => SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
};
