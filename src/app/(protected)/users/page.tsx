"use client";

import { getCurrentUser } from "@/lib/auth";
import { Team, teamsApi } from "@/lib/teams";
import { User, usersApi } from "@/lib/users";
import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Loading from "@/components/ui/Loading";

const roleLabel: Record<string, string> = {
  OWNER: "เจ้าของ",
  SUPERVISOR: "หัวหน้าทีม",
  EMPLOYEE: "พนักงาน",
};

type ModalMode = "create" | "edit" | null;

const UsersPage = () => {
  const currentUser = getCurrentUser();
  const isOwner = currentUser?.role === "OWNER";

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeam] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // ตัวเดียวคุมว่า modal เปิดโหมดไหน (แทน modalOpen + editingUser แยกกัน)
  const [mode, setMode] = useState<ModalMode>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ฟอร์มใช้ร่วมกันทั้ง create/edit (create มี field เพิ่ม password/role/teamId)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [teamId, setTeamId] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, teamsRes] = await Promise.all([
        usersApi.list(),
        teamsApi.list(),
      ]);
      setUsers(usersRes.data);
      setTeam(teamsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setRole("EMPLOYEE");
    setTeamId("");
    setError("");
  };

  const openCreateModal = () => {
    resetForm();
    if (!isOwner) setRole("EMPLOYEE");
    setMode("create");
  };

  const openEditModal = (u: User) => {
    resetForm();
    setEditingUserId(u.id);
    setFullName(u.full_name);
    setEmail(u.email);
    setMode("edit");
  };

  const closeModal = () => {
    setMode(null);
    setEditingUserId(null);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "create") {
        await usersApi.create({
          email,
          password,
          fullName,
          role: isOwner ? role : "EMPLOYEE",
          teamId: isOwner ? teamId || undefined : (currentUser?.teamId ?? undefined),
        });
      } else if (mode === "edit" && editingUserId) {
        await usersApi.update(editingUserId, { fullName, email });
      }
      closeModal();
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (mode === "create" ? "สร้างบัญชีไม่สำเร็จ" : "แก้ไขไม่สำเร็จ"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await usersApi.setActive(u.id, !u.is_active);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>
        <button
          onClick={openCreateModal}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + สร้างบัญชีใหม่
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อ</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">สิทธิ์</th>
              <th className="px-4 py-3 font-medium">ทีม</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-4 py-3 font-medium text-gray-800">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600">{roleLabel[u.role] || u.role}</td>
                <td className="px-4 py-3 text-gray-600">
                  {teams.find((t) => t.id === u.team_id)?.name || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      u.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {u.is_active ? "ใช้งานอยู่" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(u)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-xs hover:underline ${
                        u.is_active ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {u.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={mode !== null}
        onClose={closeModal}
        title={mode === "create" ? "สร้างบัญชีใหม่" : "แก้ไขข้อมูลผู้ใช้"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              อีเมล *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* password/role/team โชว์เฉพาะตอน create เท่านั้น */}
          {mode === "create" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  รหัสผ่าน *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {isOwner ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    สิทธิ์ *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="OWNER">เจ้าของ</option>
                    <option value="SUPERVISOR">หัวหน้าทีม</option>
                    <option value="EMPLOYEE">พนักงาน</option>
                  </select>
                </div>
              ) : (
                <div className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  สิทธิ์: พนักงาน (หัวหน้าทีมสร้างได้แค่บัญชีพนักงาน)
                </div>
              )}

              {isOwner ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    ทีม
                  </label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- ไม่สังกัดทีม --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded bg-gray-50 px-3 py-2 text-sm text-gray-500">
                  ทีม: {teams.find((t) => t.id === currentUser?.teamId)?.name || "—"}
                </div>
              )}
            </>
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
                  ? "สร้างบัญชี"
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
  );
};
export default UsersPage;