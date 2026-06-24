import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { SECURE_STORE_KEYS } from '../constants/api';
import type { AuthUser } from '@apice/types';

interface JwtPayload extends AuthUser {
  iat: number;
  exp: number;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

export interface UseAuthReturn {
  user: JwtPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from SecureStore
  useEffect(() => {
    async function restoreSession() {
      try {
        const accessToken = await SecureStore.getItemAsync(
          SECURE_STORE_KEYS.ACCESS_TOKEN,
        );

        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        const payload = decodeJwt(accessToken);

        if (!payload) {
          setIsLoading(false);
          return;
        }

        if (isTokenExpired(payload)) {
          // Try to refresh
          const refreshToken = await SecureStore.getItemAsync(
            SECURE_STORE_KEYS.REFRESH_TOKEN,
          );
          if (!refreshToken) {
            setIsLoading(false);
            return;
          }

          try {
            const response = await api.post('/auth/refresh', { refreshToken });
            const { accessToken: newAccessToken } = response.data.data as {
              accessToken: string;
            };
            await SecureStore.setItemAsync(
              SECURE_STORE_KEYS.ACCESS_TOKEN,
              newAccessToken,
            );
            const newPayload = decodeJwt(newAccessToken);
            setUser(newPayload);
          } catch {
            await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
            await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
          }
        } else {
          setUser(payload);
        }
      } catch {
        // Silent fail — user will need to log in again
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken } = response.data.data as {
      accessToken: string;
      refreshToken: string;
    };

    await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(
      SECURE_STORE_KEYS.REFRESH_TOKEN,
      refreshToken,
    );

    const payload = decodeJwt(accessToken);
    setUser(payload);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(
        SECURE_STORE_KEYS.REFRESH_TOKEN,
      );
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }).catch(() => {
          // Ignore logout API errors — clean local state regardless
        });
      }
    } finally {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH_TOKEN);
      setUser(null);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };
}

export default useAuth;
