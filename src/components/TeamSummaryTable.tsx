'use client';

import { TeamSummary } from '@/lib/task-stats';

export function TeamSummaryTable({ summaries }: { summaries: TeamSummary[] }) {
  if (summaries.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          สรุปรายทีม
        </h3>
        <p className="text-sm text-gray-400">ยังไม่มีทีมในระบบ</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">สรุปรายทีม</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-100">
            <th className="py-2 font-medium">ทีม</th>
            <th className="py-2 font-medium text-center">ทั้งหมด</th>
            <th className="py-2 font-medium text-center">กำลังทำ</th>
            <th className="py-2 font-medium text-center">รอตรวจ</th>
            <th className="py-2 font-medium text-center">เลยกำหนด</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map((s) => (
            <tr key={s.teamId} className="border-b border-gray-50 last:border-0">
              <td className="py-3 font-medium text-gray-700">{s.teamName}</td>
              <td className="py-3 text-center text-gray-700">{s.total}</td>
              <td className="py-3 text-center text-amber-600">{s.inProgress}</td>
              <td className="py-3 text-center text-purple-600">
                {s.pendingReview}
              </td>
              <td className="py-3 text-center text-rose-600">{s.overdue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}