'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Router,
  Users,
  LineChart,
  CreditCard,
  Settings,
  Network,
  HardDrive,
  UserCog,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react';

const routes = [
  { label: 'Dashboard', href: '/', icon: LineChart },
  { label: 'Mikrotik', href: '/mikrotik', icon: Router },
  { label: 'Clientes', href: '/clients', icon: Users },
  { label: 'Planes', href: '/plans', icon: HardDrive },
  { label: 'Colas', href: '/queues', icon: Network },
  { label: 'PPPoE', href: '/pppoe', icon: Users },
  { label: 'Facturación', href: '/invoices', icon: CreditCard },
  { label: 'Caja', href: '/payments', icon: Wallet, highlight: true },
  { label: 'Personal', href: '/employees', icon: UserCog },
  { label: 'Nómina', href: '/payrolls', icon: DollarSign },
  { label: 'Contratos', href: '/contracts', icon: FileText },
  { label: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-all"
        style={{ left: collapsed ? '4rem' : '16rem' }}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
      <aside className={`fixed left-0 top-0 h-screen ${collapsed ? 'w-16' : 'w-64'} border-r bg-slate-900 text-white transition-all duration-300`}>
        <div className={`flex h-16 items-center border-b border-slate-700 ${collapsed ? 'justify-center px-2' : 'px-6'}`}>
          {!collapsed && <h1 className="text-xl font-bold">Nexu-Core</h1>}
          {collapsed && <h1 className="text-lg font-bold">NX</h1>}
        </div>
        <nav className="space-y-1 p-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === route.href
                  ? 'bg-blue-600 text-white'
                  : route.highlight
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? route.label : undefined}
            >
              <route.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && route.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}