'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { logout, getCurrentUser } from '@/lib/auth';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [checked, setChecked] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const currentUser = getCurrentUser();

  useEffect(() => {
    const token = Cookies.get('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setChecked(true);
  }, [router]);

  // sync search input กับ query param ปัจจุบัน (เผื่อ user เข้ามาจาก URL ที่มี ?q= อยู่แล้ว)
  useEffect(() => {
    setSearchValue(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    // ถ้าไม่ได้อยู่หน้า /tasks ให้พาไปหน้านั้นพร้อมคำค้นหาเลย
    const targetPath = pathname === '/tasks' ? pathname : '/tasks';
    router.push(`${targetPath}?${params.toString()}`);
  };

  if (!checked) return null;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tasks', label: 'ดูรายการงาน' },
    ...(currentUser?.role === 'OWNER'
      ? [
          { href: '/users', label: 'จัดการผู้ใช้' },
          { href: '/teams', label: 'จัดการทีม' },
        ]
      : currentUser?.role === 'SUPERVISOR'
        ? [{ href: '/users', label: 'จัดการผู้ใช้' }]
        : []),
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <h1 className="text-xl font-bold text-gray-800">Task Office</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition ${
                pathname === item.href
                  ? 'text-white bg-indigo-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="w-96">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ค้นหางาน..."
              className="w-full pl-4 pr-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700">🔔</button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm">
                {(currentUser?.fullName?.[0] || currentUser?.email?.[0] || '?').toUpperCase()}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-gray-700 leading-tight">
                  {currentUser?.fullName || currentUser?.email}
                </p>
                <p className="text-xs text-gray-400 leading-tight">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}