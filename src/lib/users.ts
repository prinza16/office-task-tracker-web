// src/lib/users.ts
import { api } from './api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  team_id: string | null;
  is_active: boolean;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: string;
  teamId?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
}

export const usersApi = {
  list: () => api.get<User[]>('/users'),
  create: (payload: CreateUserPayload) => api.post<User>('/users', payload),
  update: (id: string, payload: UpdateUserPayload) =>
    api.patch<User>(`/users/${id}`, payload),
  setActive: (id: string, isActive: boolean) =>
    api.patch<User>(`/users/${id}/active`, { isActive }),
};