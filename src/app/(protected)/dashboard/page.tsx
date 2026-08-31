'use client';

import { useEffect, useState } from 'react';
import { tasksApi, Task } from '@/lib/tasks';
import { teamsApi, Team } from '@/lib/teams';
import { usersApi, User } from '@/lib/users';
import {
  calculateTaskStats,
  getPendingReviewTasks,
  getMyActionableTasks,
  getRecentTasks,
  getTeamSummaries,
} from '@/lib/task-stats';
import { getCurrentUser } from '@/lib/auth';
import { TaskMiniList } from '@/components/TaskMiniList';
import { TeamSummaryTable } from '@/components/TeamSummaryTable';
import Modal from '@/components/ui/Modal'; 

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- Modal & Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const isOwner = user?.role === 'OWNER';
  const canManage = user?.role === 'OWNER' || user?.role === 'SUPERVISOR';

  // ฟังก์ชันโหลดข้อมูล (ดึง currentUser จาก state/localStorage)
  const fetchData = (currentUser = user) => {
    const currentUserIsOwner = currentUser?.role === 'OWNER';
    const currentUserCanManage = currentUser?.role === 'OWNER' || currentUser?.role === 'SUPERVISOR';

    const requests: [Promise<any>, Promise<any>?, Promise<any>?] = [tasksApi.list()];
    if (currentUserIsOwner) requests.push(teamsApi.list());
    if (currentUserCanManage) requests.push(usersApi.list());

    Promise.all(requests)
      .then(([tasksRes, teamsRes, usersRes]) => {
        setTasks(tasksRes.data);
        if (teamsRes) {
          setTeams(teamsRes.data);
          if (teamsRes.data.length === 1) setTeamId(teamsRes.data[0].id);
        }
        if (usersRes) setUsers(usersRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // ดึงข้อมูล User เมื่อแสดงผลบน Client
    const currentUser = getCurrentUser();
    setUser(currentUser);
    fetchData(currentUser);
  }, []);

  const modalAssignableUsers = users.filter(
    (u) => u.team_id === teamId && u.role === 'EMPLOYEE'
  );

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!teamId) {
      setCreateError('กรุณาเลือกทีม');
      return;
    }

    setCreateLoading(true);
    try {
      await tasksApi.create({
        title,
        description: description || undefined,
        teamId,
        assignedToId: assignedToId || undefined,
        dueDate: dueDate || undefined,
      });

      // Reset form & Close modal
      setTitle('');
      setDescription('');
      setAssignedToId('');
      setDueDate('');
      setIsModalOpen(false);

      // โหลดข้อมูล Dashboard ใหม่
      fetchData();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'สร้างงานไม่สำเร็จ');
    } finally {
      setCreateLoading(false);
    }
  };

  const stats = calculateTaskStats(tasks);
  const pendingReviewTasks = canManage ? getPendingReviewTasks(tasks) : [];
  const myTasks = user?.id ? getMyActionableTasks(tasks, user.id) : [];
  const recentTasks = getRecentTasks(tasks, 5);
  const teamSummaries = isOwner ? getTeamSummaries(tasks, teams) : [];

  const cards = [
    { label: 'งานทั้งหมด', value: stats.total, color: 'text-gray-800' },
    { label: 'กำลังทำ', value: stats.inProgress, color: 'text-amber-600' },
    { label: 'รอตรวจ', value: stats.pendingReview, color: 'text-purple-600' },
    { label: 'เสร็จแล้ว', value: stats.completed, color: 'text-emerald-600' },
    { label: 'เลยกำหนด', value: stats.overdue, color: 'text-rose-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
          >
            + New Task
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400">กำลังโหลด...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {cards.map((card) => (
              <div
                key={card.label}
                className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {isOwner && (
            <div className="mb-4">
              <TeamSummaryTable summaries={teamSummaries} />
            </div>
          )}

          <div
            className={`grid grid-cols-1 gap-4 mb-6 ${
              canManage ? 'md:grid-cols-2' : ''
            }`}
          >
            <TaskMiniList
              title="งานของฉันที่ต้องทำ"
              tasks={myTasks}
              emptyText="ไม่มีงานที่ต้องทำตอนนี้"
            />
            {canManage && (
              <TaskMiniList
                title="รอฉันตรวจ"
                tasks={pendingReviewTasks}
                emptyText="ไม่มีงานรอตรวจตอนนี้"
              />
            )}
          </div>

          <TaskMiniList
            title="ความเคลื่อนไหวล่าสุด"
            tasks={recentTasks}
            emptyText="ยังไม่มีความเคลื่อนไหว"
            showTime
          />
        </>
      )}

      {/* Modal สร้างงานใหม่ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">รายละเอียด</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ทีม *</label>
            <select
              value={teamId}
              onChange={(e) => {
                setTeamId(e.target.value);
                setAssignedToId('');
              }}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createLoading ? 'กำลังสร้าง...' : 'สร้างงาน'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}