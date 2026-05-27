import axios from 'axios';
import {clearToken, getToken} from './auth';

const client = axios.create({baseURL: 'http://localhost:8000'});

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
