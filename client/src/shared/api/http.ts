import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody, SessionResponse } from '@/shared/types';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const http = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

http.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<SessionResponse>(`${API_URL}/auth/refresh`, null, { withCredentials: true })
      .then((response) => {
        setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetryConfig | undefined;
    const isAuthRoute =
      original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      } catch {
        setAccessToken(null);
        onSessionExpired?.();
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'No se pudo conectar con el servidor';
    return error.response.data?.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.status === 422) {
    const details = error.response.data?.details;
    if (details && typeof details === 'object') return details as Record<string, string>;
  }
  return {};
}
