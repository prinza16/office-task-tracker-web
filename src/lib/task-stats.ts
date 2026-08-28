// src/lib/task-stats.ts
import { Task } from './tasks';
import { Team } from './teams';

export interface TaskStats {
  total: number;
  inProgress: number;
  pendingReview: number;
  completed: number;
  overdue: number;
}

export interface TeamSummary {
  teamId: string;
  teamName: string;
  total: number;
  inProgress: number;
  pendingReview: number;
  overdue: number;
}

export function calculateTaskStats(tasks: Task[]): TaskStats {
  const now = new Date();

  return {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    pendingReview: tasks.filter((t) => t.status === 'PENDING_REVIEW').length,
    completed: tasks.filter((t) => t.status === 'APPROVED').length,
    overdue: tasks.filter((t) => {
      if (!t.due_date) return false;
      if (t.status === 'APPROVED' || t.status === 'CANCELLED') return false;
      return new Date(t.due_date) < now;
    }).length,
  };
}

export function getPendingReviewTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status === 'PENDING_REVIEW');
}

export function getMyActionableTasks(tasks: Task[], userId: string): Task[] {
  return tasks.filter(
    (t) =>
      t.assigned_to_id === userId &&
      ['ASSIGNED', 'REJECTED', 'IN_PROGRESS'].includes(t.status),
  );
}

export function getRecentTasks(tasks: Task[], limit = 5): Task[] {
  return [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
    .slice(0, limit);
}

export function getTeamSummaries(tasks: Task[], teams: Team[]): TeamSummary[] {
  const now = new Date();

  return teams.map((team) => {
    const teamTasks = tasks.filter((t) => t.team_id === team.id);
    return {
      teamId: team.id,
      teamName: team.name,
      total: teamTasks.length,
      inProgress: teamTasks.filter((t) => t.status === 'IN_PROGRESS').length,
      pendingReview: teamTasks.filter((t) => t.status === 'PENDING_REVIEW')
        .length,
      overdue: teamTasks.filter((t) => {
        if (!t.due_date) return false;
        if (t.status === 'APPROVED' || t.status === 'CANCELLED') return false;
        return new Date(t.due_date) < now;
      }).length,
    };
  });
}