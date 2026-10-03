import axios from 'axios';

export const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'http://localhost:3000';

const TOKEN_KEY = 'nmpi_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('nmpi:session-expired'));
    }
    return Promise.reject(error);
  }
);

export function errorMessage(err: any, fallback = 'Something went wrong. Please try again.'): string {
  if (!err?.response) return 'Cannot reach the server. Check that the backend API is running.';
  return err.response?.data?.message || fallback;
}

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function downloadFile(url: string, fallbackName: string) {
  const res = await api.get(url, { responseType: 'blob' });
  const disposition = String(res.headers['content-disposition'] || '');
  const match = disposition.match(/filename="?([^"]+)"?/);
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = match?.[1] || fallbackName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
