import { api } from './api';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  team_id: string;
  created_by_id: string;
  created_by_name: string | null;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  reviewed_by_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  teamId: string;
  assignedToId?: string;
  dueDate?: string;
}

export const tasksApi = {
  list: () => api.get<Task[]>('/tasks'),
  create: (payload: CreateTaskPayload) => api.post<Task>('/tasks', payload),
  start: (id: string) => api.patch(`/tasks/${id}/start`),
  submit: (id: string) => api.patch(`/tasks/${id}/submit`),
  approve: (id: string) => api.patch(`/tasks/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.patch(`/tasks/${id}/reject`, { reason }),
  reassign: (id: string, assignedToId: string) =>
    api.patch(`/tasks/${id}/reassign`, { assignedToId }),
  cancel: (id: string, reason: string) =>
    api.patch(`/tasks/${id}/cancel`, { reason }),
};