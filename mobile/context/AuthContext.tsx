import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import Config from 'react-native-config';
import {clearTokens, fetchDevToken, getStoredTokens, setSignOutCallback, storeTokens} from '../api/auth';
import client from '../api/client';

type AuthState = 'loading' | 'unauthenticated' | 'authenticated';

type AuthContextValue = {
  authState: AuthState;
  // ── Production ──
  signInWithApple: (identityToken: string) => Promise<void>;
  // ── Dev (AUTH_DEV_MODE=1 only) ──
  signInDev: () => Promise<void>;
  // ── Shared ──
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [authState, setAuthState] = useState<AuthState>('loading');

  // ── Shared: sign-out ───────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await clearTokens();
    setAuthState('unauthenticated');
  }, []);

  // Wire the axios 401 interceptor to signOut so it can navigate to the
  // sign-in screen without importing React context directly.
  useEffect(() => {
    setSignOutCallback(signOut);
  }, [signOut]);

  // ── On mount: check for existing session ──────────────────────────────────
  // Dev: auto-fetch a token on every cold start; the sign-in screen is skipped.
  // Prod: check Keychain for tokens stored from a previous Apple sign-in.
  useEffect(() => {
    if (Config.AUTH_DEV_MODE === '1') {
      fetchDevToken()
        .then(() => setAuthState('authenticated'))
        .catch(() => setAuthState('unauthenticated'));
    } else {
      getStoredTokens().then(tokens => {
        setAuthState(tokens ? 'authenticated' : 'unauthenticated');
      });
    }
  }, []);

  // ── Production: Sign in with Apple ────────────────────────────────────────
  // Exchanges an Apple identity token for a wandur access + refresh token pair.
  const signInWithApple = useCallback(async (identityToken: string) => {
    const res = await client.post('/auth/apple', {identity_token: identityToken});
    await storeTokens(res.data.access_token, res.data.refresh_token);
    setAuthState('authenticated');
  }, []);

  // ── Dev: email/password sign-in (AUTH_DEV_MODE=1 only) ───────────────────
  // Hits POST /auth/token. The backend issues the same token pair as the Apple
  // flow, so refresh, 401 retry, and sign-out work identically in both envs.
  const signInDev = useCallback(async () => {
    await fetchDevToken();
    setAuthState('authenticated');
  }, []);

  return (
    <AuthContext.Provider value={{authState, signInWithApple, signInDev, signOut}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
