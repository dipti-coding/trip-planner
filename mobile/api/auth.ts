import axios from 'axios';
import Config from 'react-native-config';
import * as Keychain from 'react-native-keychain';

// ══════════════════════════════════════════════════════════════════════════════
// KEYCHAIN STORAGE
// All tokens live in the iOS Keychain under the 'wandur' service namespace.
// ══════════════════════════════════════════════════════════════════════════════

const SERVICE = 'wandur';
const ACCESS_ACCOUNT  = 'access_token';
const REFRESH_ACCOUNT = 'refresh_token';

export async function getStoredTokens(): Promise<{access: string; refresh: string} | null> {
  const [accessCreds, refreshCreds] = await Promise.all([
    Keychain.getGenericPassword({service: `${SERVICE}.${ACCESS_ACCOUNT}`}),
    Keychain.getGenericPassword({service: `${SERVICE}.${REFRESH_ACCOUNT}`}),
  ]);
  if (!accessCreds || !refreshCreds) return null;
  return {access: accessCreds.password, refresh: refreshCreds.password};
}

export async function storeTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    Keychain.setGenericPassword(ACCESS_ACCOUNT,  access,  {service: `${SERVICE}.${ACCESS_ACCOUNT}`}),
    Keychain.setGenericPassword(REFRESH_ACCOUNT, refresh, {service: `${SERVICE}.${REFRESH_ACCOUNT}`}),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    Keychain.resetGenericPassword({service: `${SERVICE}.${ACCESS_ACCOUNT}`}),
    Keychain.resetGenericPassword({service: `${SERVICE}.${REFRESH_ACCOUNT}`}),
  ]);
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED: TOKEN REFRESH + SIGN-OUT CALLBACK
// Used by both production and dev flows. The axios interceptor in client.ts
// calls refreshAccessToken() on 401 and triggerSignOut() if refresh also fails.
// ══════════════════════════════════════════════════════════════════════════════

export async function refreshAccessToken(): Promise<string | null> {
  const creds = await Keychain.getGenericPassword({service: `${SERVICE}.${REFRESH_ACCOUNT}`});
  if (!creds) return null;
  try {
    const res = await axios.post(`${Config.LOCAL_API_URL}/auth/refresh`, {
      refresh_token: creds.password,
    });
    const newAccess: string = res.data.access_token;
    await Keychain.setGenericPassword(ACCESS_ACCOUNT, newAccess, {
      service: `${SERVICE}.${ACCESS_ACCOUNT}`,
    });
    return newAccess;
  } catch {
    return null;
  }
}

let _signOutCallback: (() => void) | null = null;
export function setSignOutCallback(fn: () => void) { _signOutCallback = fn; }
export function triggerSignOut() { _signOutCallback?.(); }

// ══════════════════════════════════════════════════════════════════════════════
// DEV AUTH — only called when AUTH_DEV_MODE=1
// Hits POST /auth/token (email + password) instead of Apple. The backend issues
// the same access + refresh token pair as the production flow, so refresh, 401
// retry, and sign-out all work identically in both environments.
// ══════════════════════════════════════════════════════════════════════════════

export async function fetchDevToken(): Promise<void> {
  const params = new URLSearchParams();
  params.append('username', Config.TEST_EMAIL ?? '');
  params.append('password', Config.TEST_PWD ?? '');
  const res = await axios.post(
    `${Config.LOCAL_API_URL}/auth/token`,
    params.toString(),
    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
  );
  await storeTokens(res.data.access_token, res.data.refresh_token);
}
