'use client';

import { useEffect, useState, useRef } from 'react';
import { Users, Router, DollarSign, Cpu, HardDrive, Activity, Wifi, Signal, Clock, UserPlus, AlertCircle, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  totalClients: number;
  totalMikrotiks: number;
  activeInvoices: number;
  revenue: number;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  period: string;
  dueDate: string;
  paidDate: string | null;
  description: string;
  client: {
    name: string;
    lastName: string;
  };
}

interface Client {
  id: string;
  name: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface Mikrotik {
  id: string;
  name: string;
  ip: string;
  status: string;
}

interface MikrotikStats {
  mikrotikId: string;
  cpuUsage: number;
  ramUsage: number;
  uptime: number;
  rxBytes: number;
  txBytes: number;
  hddUsage: number;
  temperature: number;
  version: string;
  timestamp: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
};

interface RecentActivity {
  id: string;
  type: 'payment' | 'new_client' | 'overdue_invoice';
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  icon: typeof CheckCircle;
  color: string;
}

const formatDate = (date: string): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} horas`;
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const formatDueDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalMikrotiks: 0,
    activeInvoices: 0,
    revenue: 0,
  });
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [selectedMikrotik, setSelectedMikrotik] = useState<string>('');
  const [mikrotikStats, setMikrotikStats] = useState<MikrotikStats | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [clients, mikrotiksData, invoicesResponse] = await Promise.all([
          fetchApi<any[]>('/api/clients'),
          fetchApi<Mikrotik[]>('/api/mikrotik'),
          fetchApi<{data: any[]; pagination: any}>('/api/invoices?page=1&limit=100'),
        ]);

        const invoices = invoicesResponse?.data || [];
        const activeInvoices = invoices.filter((i: any) => i.status === 'pending');
        const overdueInvoices = invoices.filter((i: any) => {
          const dueDate = new Date(i.dueDate);
          return i.status === 'pending' && dueDate < new Date();
        });
        const revenue = invoices
          .filter((i: any) => i.status === 'paid')
          .reduce((sum: number, i: any) => sum + i.amount, 0);

        const activities: RecentActivity[] = [];

        const paidInvoices = invoices.filter((i: any) => i.status === 'paid').slice(0, 5);
        paidInvoices.forEach((invoice: any) => {
          activities.push({
            id: `payment-${invoice.id}`,
            type: 'payment',
            title: `Pago recibido`,
            subtitle: `${invoice.client?.name || 'Cliente'} ${invoice.client?.lastName || ''} - ${invoice.period}`,
            amount: invoice.amount,
            date: invoice.paidDate || invoice.updatedAt,
            icon: CheckCircle,
            color: 'text-green-500 bg-green-50',
          });
        });

        const sortedClients = [...clients].sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        sortedClients.slice(0, 3).forEach((client: any) => {
          activities.push({
            id: `client-${client.id}`,
            type: 'new_client',
            title: 'Nuevo cliente',
            subtitle: `${client.name} ${client.lastName}`,
            date: client.createdAt,
            icon: UserPlus,
            color: 'text-blue-500 bg-blue-50',
          });
        });

        overdueInvoices.slice(0, 5).forEach((invoice: any) => {
          activities.push({
            id: `overdue-${invoice.id}`,
            type: 'overdue_invoice',
            title: 'Factura vencida',
            subtitle: `${invoice.client?.name || 'Cliente'} ${invoice.client?.lastName || ''} - ${invoice.period}`,
            amount: invoice.amount,
            date: invoice.dueDate,
            icon: AlertCircle,
            color: 'text-red-500 bg-red-50',
          });
        });

        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentActivity(activities.slice(0, 10));

        setMikrotiks(mikrotiksData);
        if (mikrotiksData.length > 0 && !selectedMikrotik) {
          setSelectedMikrotik(mikrotiksData[0].id);
        }

        setStats({
          totalClients: clients.length,
          totalMikrotiks: mikrotiksData.length,
          activeInvoices: activeInvoices.length,
          revenue,
        });
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadMikrotikStats() {
      if (!selectedMikrotik) return;

      try {
        const [currentStats, history] = await Promise.all([
          fetchApi<MikrotikStats>(`/api/monitoring/${selectedMikrotik}`),
          fetchApi<any[]>(`/api/monitoring/${selectedMikrotik}/history?hours=0.25`),
        ]);

        setMikrotikStats(currentStats);
        setHistoryData(history);
      } catch (error) {
        console.error('Error loading Mikrotik stats:', error);
      }
    }

    loadMikrotikStats();

    intervalRef.current = setInterval(loadMikrotikStats, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [selectedMikrotik]);

  const statCards = [
    { label: 'Clientes', value: stats.totalClients, icon: Users, color: 'bg-blue-500' },
    { label: 'Mikrotiks', value: stats.totalMikrotiks, icon: Router, color: 'bg-emerald-500' },
    { label: 'Facturas Pendientes', value: stats.activeInvoices, icon: DollarSign, color: 'bg-amber-500' },
    { label: 'Ingresos', value: `$${stats.revenue.toFixed(2)}`, icon: Activity, color: 'bg-purple-500' },
  ];

  const formatBytesPerSec = (bytes: number): string => {
  if (bytes === 0) return '0 B/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const chartData = historyData.map((stat: any, index: number) => {
  let uploadRate = 0;
  let downloadRate = 0;
  
  if (index > 0) {
    const prevStat = historyData[index - 1];
    const timeDiff = (new Date(stat.timestamp).getTime() - new Date(prevStat.timestamp).getTime()) / 1000;
    if (timeDiff > 0) {
      uploadRate = (stat.txBytes - prevStat.txBytes) / timeDiff;
      downloadRate = (stat.rxBytes - prevStat.rxBytes) / timeDiff;
    }
  }
  
  return {
    time: new Date(stat.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    upload: Math.max(0, uploadRate),
    download: Math.max(0, downloadRate),
  };
});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-600">Resumen de tu sistema ISP</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {mikrotiks.length > 0 && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Monitoreo en Tiempo Real</h2>
              {selectedMikrotik && (
                <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                  mikrotiks.find(m => m.id === selectedMikrotik)?.status === 'online' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    mikrotiks.find(m => m.id === selectedMikrotik)?.status === 'online' 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`}></span>
                  {mikrotiks.find(m => m.id === selectedMikrotik)?.status === 'online' ? 'En línea' : 'Desconectado'}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedMikrotik}
                  onChange={(e) => setSelectedMikrotik(e.target.value)}
                  className="appearance-none rounded-lg border px-4 py-2 pr-10 font-medium bg-white"
                >
                  {mikrotiks.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.status === 'online' ? '●' : '○'} {m.name} - {m.ip}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={() => {
                  if (selectedMikrotik) {
                    fetchApi(`/api/mikrotik/${selectedMikrotik}/test`, { method: 'POST' })
                      .then(() => window.location.reload())
                      .catch(console.error);
                  }
                }}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
                title="Probar conexión"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {mikrotikStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-slate-600">CPU</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{mikrotikStats.cpuUsage.toFixed(1)}%</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-slate-600">RAM</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{mikrotikStats.ramUsage.toFixed(1)}%</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-slate-600">HDD</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{mikrotikStats.hddUsage.toFixed(1)}%</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wifi className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-slate-600">TX</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">{formatBytes(mikrotikStats.txBytes)}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Signal className="h-4 w-4 text-cyan-500" />
                  <span className="text-sm text-slate-600">RX</span>
                </div>
                <p className="text-2xl font-bold text-cyan-600">{formatBytes(mikrotikStats.rxBytes)}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Temp</span>
                </div>
                <p className="text-2xl font-bold text-slate-700">{mikrotikStats.temperature}°C</p>
              </div>
            </div>
          )}

          {mikrotikStats && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600">Uptime</span>
                </div>
                <p className="text-lg font-bold text-slate-700">{formatUptime(mikrotikStats.uptime)}</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-slate-600">Versión RouterOS</span>
                </div>
                <p className="text-lg font-bold text-purple-700">{mikrotikStats.version}</p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-slate-600 mb-4">Tráfico de Red - Interfaces (TX/RX)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" fontSize={12} stroke="#94a3b8" />
                <YAxis fontSize={12} stroke="#94a3b8" tickFormatter={formatBytesPerSec} />
                <Tooltip formatter={(value: number) => formatBytesPerSec(value)} labelStyle={{ color: '#475569' }} />
                <Area type="monotone" dataKey="upload" stroke="#f97316" fill="url(#colorUpload)" name="TX (Upload)" strokeWidth={2} />
                <Area type="monotone" dataKey="download" stroke="#06b6d4" fill="url(#colorDownload)" name="RX (Download)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {mikrotiks.length === 0 && !loading && (
        <div className="rounded-lg border bg-white p-6 shadow-sm text-center">
          <Router className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">No hay Mikrotiks configurados</h3>
          <p className="text-slate-500">Agrega un Mikrotik para ver el monitoreo en tiempo real</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold">Historial Reciente</h2>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${activity.color}`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-500 truncate">{activity.subtitle}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {activity.amount && (
                      <p className="text-sm font-semibold text-slate-900">${activity.amount.toFixed(2)}</p>
                    )}
                    <p className="text-xs text-slate-400">{formatDate(activity.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No hay actividad reciente</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Facturas Vencidas</h2>
          </div>

          {recentActivity.filter(a => a.type === 'overdue_invoice').length > 0 ? (
            <div className="space-y-3">
              {recentActivity
                .filter(a => a.type === 'overdue_invoice')
                .map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{invoice.subtitle}</p>
                        <p className="text-xs text-red-600">Vencida: {formatDueDate(invoice.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">${invoice.amount?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-3" />
              <p className="text-slate-500">No hay facturas vencidas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}