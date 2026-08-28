import { api } from './api';

export interface Team {
  id: string;
  name: string;
  supervisor_id: string | null;
}

export interface CreateTeamPayload {
  name: string;
}

export interface UpdateTeamPayload {
  name: string;
}

export const teamsApi = {
  list: () => api.get<Team[]>('/teams'),
  create: (payload: CreateTeamPayload) => api.post<Team>('/teams', payload),
  update: (id: string, payload: UpdateTeamPayload) =>
    api.patch<Team>(`/teams/${id}`, payload),
  setSupervisor: (id: string, supervisorId: string) =>
    api.patch<Team>(`/teams/${id}/supervisor`, { supervisorId }),
};