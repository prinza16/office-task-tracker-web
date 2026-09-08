// src/components/TaskMiniList.tsx
'use client';

import Link from 'next/link';
import { Task } from '@/lib/tasks';
import { statusConfig } from '@/lib/task-status';
import { formatRelativeTime } from '@/lib/format-time';
import { TaskTimerBar } from './TaskTimerBar'; // 1. Import Component เข้ามา

export function TaskMiniList({
  title,
  tasks,
  emptyText,
  showTime = false,
}: {
  title: string;
  tasks: Task[];
  emptyText: string;
  showTime?: boolean;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-base font-semibold text-gray-800 mb-3">{title}</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const status = statusConfig[task.status] || {
              label: task.status,
              color: 'bg-gray-100 text-gray-700',
            };
            return (
              <Link
                key={task.id}
                href="/tasks"
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
              >
                <div className="flex flex-col">
                  {/* 2. ปรับเป็น flex items-center gap-2 เพื่อวางเวลาต่อท้ายชื่องาน */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {task.title}
                    </span>
                    {/* 🧩 แปะจิ๊กซอว์ TaskTimerBar ไว้ตรงนี้ */}
                    <TaskTimerBar
                      status={task.status}
                      totalSeconds={(task as any).total_seconds || 0}
                    />
                  </div>
                  
                  {showTime && (
                    <span className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(task.updated_at)}
                    </span>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${status.color}`}
                >
                  {status.label}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}