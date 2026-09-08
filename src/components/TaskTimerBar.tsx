'use client';

import { useState, useEffect } from 'react';

interface TaskTimerProps {
  status: string;
  totalSeconds: number;
}

export function TaskTimerBar({ status, totalSeconds }: TaskTimerProps) {
  const isRunning = status === 'IN_PROGRESS';
  const [seconds, setSeconds] = useState(totalSeconds || 0);

  // อัปเดตเวลาสะสมหาก prop เปลี่ยน
  useEffect(() => {
    setSeconds(totalSeconds || 0);
  }, [totalSeconds]);

  // จับเวลาเดินเมื่อสถานะเป็น IN_PROGRESS
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // แปลงวินาทีเป็นรูปแบบ 00:00:00
  const formatTime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isRunning
          ? 'bg-amber-100 text-amber-800 animate-pulse'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      ⏱️ {formatTime(seconds)}
    </span>
  );
}