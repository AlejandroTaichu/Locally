import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { tokenStorage } from './token-storage';
import { getMe } from '../api/users';
import type { AuthResult, User } from '../api/auth';

interface AuthContextValue {
  isLoading: boolean;
  token: string | null;
  user: User | null;
  login: (result: AuthResult) => Promise<void>;
  logout: () => Promise<void>;
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

      try {
        const me = await getMe(storedToken);
        setToken(storedToken);
        setUser(me);
      } catch {
        await tokenStorage.clear();
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
        setToken(result.accessToken);
        setUser(result.user);
      },
      logout: async () => {
        await tokenStorage.clear();
        setToken(null);
        setUser(null);
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
