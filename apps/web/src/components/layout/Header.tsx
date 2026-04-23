'use client';

import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useState, useRef } from 'react';
import NotificationsPanel from '@/components/Notifications';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="h-10 w-80 rounded-lg border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationsPanel />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">{user.name || 'Usuario'}</span>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white py-2 shadow-lg z-50">
              <div className="border-b px-4 py-2">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <button
                onClick={() => router.push('/settings')}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-slate-100"
              >
                <Settings className="h-4 w-4" />
                Configuración
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}