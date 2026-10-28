import { http } from '@/shared/api/http';
import type { PaginatedResult, Role, User } from '@/shared/types';

export interface UserFilters {
  search?: string;
  roleId?: number | '';
  active?: boolean | '';
  page?: number;
  limit?: number;
}

export interface UserInput {
  username: string;
  dni: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password?: string;
  roleId: number;
}

export const usersApi = {
  async list(filters: UserFilters): Promise<PaginatedResult<User>> {
    const params: Record<string, unknown> = { page: filters.page, limit: filters.limit };
    if (filters.search) params.search = filters.search;
    if (filters.roleId !== '' && filters.roleId !== undefined) params.roleId = filters.roleId;
    if (filters.active !== '' && filters.active !== undefined) params.active = filters.active;
    const { data } = await http.get<PaginatedResult<User>>('/users', { params });
    return data;
  },

  async create(input: UserInput): Promise<User> {
    const { data } = await http.post<User>('/users', input);
    return data;
  },

  async update(id: number, input: Omit<UserInput, 'username' | 'password'>): Promise<User> {
    const { data } = await http.put<User>(`/users/${id}`, input);
    return data;
  },

  async setActive(id: number, active: boolean): Promise<User> {
    const { data } = await http.patch<User>(`/users/${id}/status`, { active });
    return data;
  },

  async resetPassword(id: number, newPassword: string): Promise<void> {
    await http.put(`/users/${id}/reset-password`, { newPassword });
  },

  async roles(): Promise<Role[]> {
    const { data } = await http.get<Role[]>('/roles');
    return data;
  },
};
