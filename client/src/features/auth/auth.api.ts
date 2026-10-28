import { http } from '@/shared/api/http';
import type { SessionResponse, User } from '@/shared/types';

export interface LoginPayload {
  username: string;
  password: string;
  remember: boolean;
}

export const authApi = {
  async login(payload: LoginPayload): Promise<SessionResponse> {
    const { data } = await http.post<SessionResponse>('/auth/login', payload);
    return data;
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout');
  },

  async me(): Promise<User> {
    const { data } = await http.get<User>('/auth/me');
    return data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await http.put('/auth/change-password', { currentPassword, newPassword });
  },
};
