'use client';

import { useEffect, useState } from 'react';
import { tasksApi, Task } from '@/lib/tasks';
import { usersApi, User } from '@/lib/users';
import { teamsApi, Team } from '@/lib/teams';
import { statusConfig } from '@/lib/task-status';
import { getCurrentUser } from '@/lib/auth';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/ui/Modal';

const ACTIONABLE_STATUSES = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_REVIEW', 'REJECTED'];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // --- Modal & Create Task State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createTeamId, setCreateTeamId] = useState('');
  const [createAssignedToId, setCreateAssignedToId] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // --- Reassign / Cancel State ---
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q')?.toLowerCase() || '';

  const user = getCurrentUser();
  const canManage = user?.role === 'OWNER' || user?.role === 'SUPERVISOR';

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await tasksApi.list();
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    if (canManage) {
      usersApi.list().then((res) => setUsers(res.data)).catch((err) => console.error(err));
      teamsApi.list().then((res) => {
        setTeams(res.data);
        if (res.data.length === 1) setCreateTeamId(res.data[0].id);
      }).catch((err) => console.error(err));
    }
  }, []);

  // กรอง User สำหรับ Modal สร้างงาน
  const modalAssignableUsers = users.filter(
    (u) => u.team_id === createTeamId && u.role === 'EMPLOYEE'
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!createTeamId) {
      setCreateError('กรุณาเลือกทีม');
      return;
    }

    setCreateLoading(true);
    try {
      await tasksApi.create({
        title: createTitle,
        description: createDescription || undefined,
        teamId: createTeamId,
        assignedToId: createAssignedToId || undefined,
        dueDate: createDueDate || undefined,
      });

      // ล้างข้อมูลฟอร์มและปิด Modal
      setCreateTitle('');
      setCreateDescription('');
      setCreateAssignedToId('');
      setCreateDueDate('');
      setIsCreateModalOpen(false);

      await loadTasks(); // โหลดรายการงานใหม่
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'สร้างงานไม่สำเร็จ');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'start' | 'submit' | 'approve') => {
    setActionLoadingId(id);
    try {
      if (action === 'start') await tasksApi.start(id);
      if (action === 'submit') await tasksApi.submit(id);
      if (action === 'approve') await tasksApi.approve(id);
      await loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      alert('กรุณาใส่เหตุผลที่ตีกลับ');
      return;
    }
    setActionLoadingId(id);
    try {
      await tasksApi.reject(id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      await loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReassign = async (id: string) => {
    if (!newAssigneeId) {
      alert('กรุณาเลือกผู้รับผิดชอบคนใหม่');
      return;
    }
    setActionLoadingId(id);
    try {
      await tasksApi.reassign(id, newAssigneeId);
      setReassigningId(null);
      setNewAssigneeId('');
      await loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!cancelReason.trim()) {
      alert('กรุณาใส่เหตุผลที่ยกเลิกงาน');
      return;
    }
    setActionLoadingId(id);
    try {
      await tasksApi.cancel(id, cancelReason);
      setCancelingId(null);
      setCancelReason('');
      await loadTasks();
    } catch (err: any) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderActions = (task: Task) => {
    const isLoading = actionLoadingId === task.id;
    const isMine = task.assigned_to_id === user?.id;
    const canManageThis = canManage && ACTIONABLE_STATUSES.includes(task.status);

    if (reassigningId === task.id) {
      const assignableUsers = users.filter((u) => {
        if (u.team_id !== task.team_id) return false;
        if (user?.role === 'SUPERVISOR') return u.role === 'EMPLOYEE';
        return u.role === 'EMPLOYEE' || u.role === 'SUPERVISOR';
      });

      return (
        <div className="flex flex-col gap-2">
          <select
            value={newAssigneeId}
            onChange={(e) => setNewAssigneeId(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="">-- เลือกผู้รับผิดชอบใหม่ --</option>
            {assignableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.email})
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => handleReassign(task.id)}
              disabled={isLoading}
              className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              ยืนยันมอบหมายใหม่
            </button>
            <button
              onClick={() => {
                setReassigningId(null);
                setNewAssigneeId('');
              }}
              className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 cursor-pointer"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      );
    }

    if (cancelingId === task.id) {
      return (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="เหตุผลที่ยกเลิกงาน"
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleCancel(task.id)}
              disabled={isLoading}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 cursor-pointer"
            >
              ยืนยันยกเลิกงาน
            </button>
            <button
              onClick={() => {
                setCancelingId(null);
                setCancelReason('');
              }}
              className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 cursor-pointer"
            >
              กลับ
            </button>
          </div>
        </div>
      );
    }

    let primaryAction: React.ReactNode = null;

    if ((task.status === 'ASSIGNED' || task.status === 'REJECTED') && isMine) {
      primaryAction = (
        <button
          onClick={() => handleAction(task.id, 'start')}
          disabled={isLoading}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
        >
          เริ่มงาน
        </button>
      );
    } else if (task.status === 'IN_PROGRESS' && isMine) {
      primaryAction = (
        <button
          onClick={() => handleAction(task.id, 'submit')}
          disabled={isLoading}
          className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
        >
          ส่งตรวจ
        </button>
      );
    } else if (
      task.status === 'PENDING_REVIEW' &&
      (user?.role === 'OWNER' || user?.role === 'SUPERVISOR')
    ) {
      if (rejectingId === task.id) {
        primaryAction = (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="เหตุผลที่ตีกลับ"
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReject(task.id)}
                disabled={isLoading}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 cursor-pointer"
              >
                ยืนยันตีกลับ
              </button>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason('');
                }}
                className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        );
      } else {
        primaryAction = (
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(task.id, 'approve')}
              disabled={isLoading}
              className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              อนุมัติ
            </button>
            <button
              onClick={() => setRejectingId(task.id)}
              disabled={isLoading}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              ตีกลับ
            </button>
          </div>
        );
      }
    }

    const managementButtons = canManageThis && (
      <div className="flex gap-2">
        <button
          onClick={() => setReassigningId(task.id)}
          disabled={isLoading}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
        >
          มอบหมายใหม่
        </button>
        <button
          onClick={() => setCancelingId(task.id)}
          disabled={isLoading}
          className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 cursor-pointer"
        >
          ยกเลิกงาน
        </button>
      </div>
    );

    return (
      <div className="flex flex-col items-end gap-2">
        {primaryAction}
        {managementButtons}
      </div>
    );
  };

  if (loading) {
    return <div className="p-8 text-gray-500">กำลังโหลด...</div>;
  }

  const filteredTasks = searchQuery
    ? tasks.filter((t) => t.title.toLowerCase().includes(searchQuery))
    : tasks;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">รายการงาน</h1>
        {canManage && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 cursor-pointer"
          >
            + สร้างงานใหม่
          </button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <p className="text-gray-500">
          {searchQuery ? 'ไม่พบงานที่ค้นหา' : 'ยังไม่มีงานในระบบ'}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const status = statusConfig[task.status] || {
              label: task.status,
              color: 'bg-gray-100 text-gray-700',
            };
            return (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    สร้างโดย: {task.created_by_name || '—'}
                    {task.assigned_to_name && ` → มอบหมายให้: ${task.assigned_to_name}`}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div>{renderActions(task)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Modal สร้างงานใหม่ --- */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="สร้างงานใหม่"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          {createError && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {createError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ชื่องาน *</label>
            <input
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">รายละเอียด</label>
            <textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ทีม *</label>
            <select
              value={createTeamId}
              onChange={(e) => {
                setCreateTeamId(e.target.value);
                setCreateAssignedToId('');
              }}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- เลือกทีม --</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">มอบหมายให้ (ไม่บังคับ)</label>
            <select
              value={createAssignedToId}
              onChange={(e) => setCreateAssignedToId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- ยังไม่มอบหมาย --</option>
              {modalAssignableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">กำหนดส่ง (ไม่บังคับ)</label>
            <input
              type="date"
              value={createDueDate}
              onChange={(e) => setCreateDueDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {createLoading ? 'กำลังสร้าง...' : 'สร้างงาน'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}