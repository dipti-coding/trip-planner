import axios from 'axios';
import {LOCAL_API_URL} from '@env';

const DEV_EMAIL = 'test@example.com';
const DEV_PASSWORD = 'REDACTED';

let _token: string | null = null;

export async function getToken(): Promise<string> {
  if (_token) {
    return _token;
  }
  const params = new URLSearchParams();
  params.append('username', DEV_EMAIL);
  params.append('password', DEV_PASSWORD);
  const res = await axios.post(
    `${LOCAL_API_URL}/auth/token`,
    params.toString(),
    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
  );
  _token = res.data.access_token;
  return _token as string;
}

export function clearToken() {
  _token = null;
}
