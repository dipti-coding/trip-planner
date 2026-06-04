import axios from 'axios';
import Config from 'react-native-config';
import {getStoredTokens, refreshAccessToken, triggerSignOut} from './auth';

const client = axios.create({baseURL: Config.LOCAL_API_URL});

// Attach the stored access token to every request.
client.interceptors.request.use(async config => {
  const tokens = await getStoredTokens();
  if (tokens) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// On 401: attempt a silent token refresh and retry once. If refresh fails,
// signal the auth context to sign the user out.
let _refreshing: Promise<string | null> | null = null;

client.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retried) {
      return Promise.reject(err);
    }
    original._retried = true;

    if (!_refreshing) {
      _refreshing = refreshAccessToken().finally(() => { _refreshing = null; });
    }
    const newToken = await _refreshing;

    if (!newToken) {
      triggerSignOut();
      return Promise.reject(err);
    }
    original.headers.Authorization = `Bearer ${newToken}`;
    return client(original);
  },
);

export default client;
