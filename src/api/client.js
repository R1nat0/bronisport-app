import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let accessToken = null;
let refreshPromise = null;
const subscribers = new Set();

export function setAccessToken(token) {
  accessToken = token;
  subscribers.forEach((cb) => cb(token));
}

export function getAccessToken() {
  return accessToken;
}

export function subscribeAuth(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const uploadsBase = API_URL.replace(/\/api$/, '');

export function resolveUploadUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${uploadsBase}${url}`;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function refreshOnce() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, null, { withCredentials: true })
      .then((r) => {
        setAccessToken(r.data.accessToken);
        return r.data;
      })
      .catch((e) => {
        setAccessToken(null);
        throw e;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/register') || original?.url?.includes('/auth/refresh');

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        await refreshOnce();
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err) {
  return err?.response?.data?.error || err?.message || 'Request failed';
}
