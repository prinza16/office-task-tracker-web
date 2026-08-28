"use client"

import Loading from "@/components/ui/Loading"
import { getCurrentUser } from "@/lib/auth"
import { Team, teamsApi } from "@/lib/teams"
import { User, usersApi } from "@/lib/users"
import { useEffect, useState } from "react"
import Modal from "@/components/ui/Modal"

type ModalMode = "create" | "edit" | null

const TeamsPage = () => {
    const currentUser = getCurrentUser()
    const isOwner = currentUser?.role === "OWNER"

    const [teams, setTeams] = useState<Team[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    const [mode, setMode] = useState<ModalMode>(null)
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null)

    const [name, setName] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    const [supervisorId, setSupervisorId] = useState('');

    const availableSupervisors = users.filter(
        (u) => u.role === "SUPERVISOR" || u.role === "MANAGER" 
    )

    const loadData = async () => {
        setLoading(true)
        try {
            const [teamsRes, usersRes] = await Promise.all([
                teamsApi.list(),
                usersApi.list(),
            ])
            setTeams(teamsRes.data)
            setUsers(usersRes.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const resetForm = () => {
        setName("")
        setSupervisorId("");
        setError("")
    }

    const openCreateModal = () => {
        resetForm()
        setMode("create")
    }

    const openEditModal = (team: Team) => {
        resetForm();
        setEditingTeamId(team.id);
        setName(team.name);
        setSupervisorId(team.supervisor_id || '');
        setMode('edit');
    };

    const closeModal = () => {
        setMode(null)
        setEditingTeamId(null)
        resetForm()
    }

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
        if (mode === 'create') {
            await teamsApi.create({ name });
        } else if (mode === 'edit' && editingTeamId) {
            await teamsApi.update(editingTeamId, { name });
            if (supervisorId) {
                await teamsApi.setSupervisor(editingTeamId, supervisorId);
            }
        }
        closeModal();
        await loadData();
    } catch (err: any) {
        setError(
            err.response?.data?.message ||
                (mode === 'create' ? 'สร้างทีมไม่สำเร็จ' : 'แก้ไขไม่สำเร็จ'),
        );
    } finally {
        setSubmitting(false);
    }
    };

    const memberCount = (teamId: string) => 
        users.filter((u) => u.team_id === teamId).length

    const supervisorName = (team: Team) => {
        if (!team.supervisor_id) return "-"
        const sup = users.find((u) => u.id === team.supervisor_id)
        return sup?.full_name || "-"
    }

    if (!isOwner) {
        return (
            <div className="p-8 text-gray-500">
                หน้านี้สำหรับเจ้าของระบบเท่านั้น
            </div>
        )
    }

    if (loading) {
        return <Loading />
    }

  return (
   <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">จัดการทีม</h1>
        <button
          onClick={openCreateModal}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + สร้างทีมใหม่
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อทีม</th>
              <th className="px-4 py-3 font-medium">หัวหน้าทีม</th>
              <th className="px-4 py-3 font-medium">จำนวนสมาชิก</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  ยังไม่มีทีมในระบบ
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {team.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {supervisorName(team)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {memberCount(team.id)} คน
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEditModal(team)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={mode !== null}
        onClose={closeModal}
        title={mode === "create" ? "สร้างทีมใหม่" : "แก้ไขชื่อทีม"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ชื่อทีม *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {mode === 'edit' && (
            <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                หัวหน้าทีม
                </label>
                <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                >
                <option value="">-- ยังไม่กำหนด --</option>
                {availableSupervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                    {s.full_name} {s.team_id && s.team_id !== editingTeamId ? '(ทีมอื่น)' : ''}
                    </option>
                ))}
                </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting
                ? "กำลังบันทึก..."
                : mode === "create"
                  ? "สร้างทีม"
                  : "บันทึก"}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
export default TeamsPage