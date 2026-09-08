import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { tokenStorage } from './token-storage';
import { getMe } from '../api/users';
import { ApiError } from '../api/client';
import type { AuthResult, User } from '../api/auth';

interface AuthContextValue {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  login: (result: AuthResult) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = await tokenStorage.get();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      // Restore the last-known session immediately from cache so the app
      // doesn't wait on a network round-trip (or worse, log the user out)
      // just because connectivity is briefly unavailable on launch.
      const cachedUser = await tokenStorage.getUser();
      if (cachedUser) {
        setToken(storedToken);
        setUser(cachedUser);
        setIsLoading(false);
      }

      try {
        const me = await getMe(storedToken);
        setToken(storedToken);
        setUser(me);
        await tokenStorage.setUser(me);
      } catch (err) {
        // Only a genuine "this token is no longer valid" response should
        // sign the user out. A network/server error must not — the user
        // stays signed in with whatever session we already restored.
        if (err instanceof ApiError && err.status === 401) {
          await tokenStorage.clear();
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      token,
      user,
      login: async (result) => {
        await tokenStorage.set(result.accessToken);
        await tokenStorage.setUser(result.user);
        setToken(result.accessToken);
        setUser(result.user);
      },
      logout: async () => {
        await tokenStorage.clear();
        setToken(null);
        setUser(null);
      },
      refreshUser: async () => {
        if (!token) return;
        const me = await getMe(token);
        setUser(me);
        await tokenStorage.setUser(me);
      },
    }),
    [isLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
