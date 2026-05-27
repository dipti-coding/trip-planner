import axios from 'axios';
import Config from 'react-native-config';
import {clearToken, getToken} from './auth';

const client = axios.create({baseURL: Config.LOCAL_API_URL});

client.interceptors.request.use(async config => {
  const token = await getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(err);
  },
);

export default client;
