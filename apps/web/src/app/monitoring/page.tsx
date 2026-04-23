'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchApi } from '@/lib/utils';

interface Stats {
  id: string;
  cpuUsage: number;
  ramUsage: number;
  uptime: number;
  rxBytes: number;
  txBytes: number;
  timestamp: string;
}

interface Mikrotik {
  id: string;
  name: string;
  status: string;
}

export default function MonitoringPage() {
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [stats, setStats] = useState<Stats[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMikrotiks() {
    try {
      const data = await fetchApi<Mikrotik[]>('/api/mikrotik');
      setMikrotiks(data);
      if (data.length > 0 && !selected) {
        setSelected(data[0].id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function loadStats() {
    if (!selected) return;
    try {
      const data = await fetchApi<Stats[]>(`/api/monitoring/${selected}/history?hours=24`);
      setStats(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMikrotiks();
  }, []);

  useEffect(() => {
    if (selected) {
      loadStats();
      const interval = setInterval(loadStats, 30000);
      return () => clearInterval(interval);
    }
  }, [selected]);

  const latest = stats[stats.length - 1];
  const chartData = stats.map(s => ({
    time: new Date(s.timestamp).toLocaleTimeString(),
    cpu: Math.round(s.cpuUsage),
    ram: Math.round(s.ramUsage),
  }));

  function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  }

  if (loading && mikrotiks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (mikrotiks.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
        <p className="text-slate-500">No hay Mikrotiks configurados</p>
        <p className="mt-2 text-sm text-slate-400">Agregue un Mikrotik para ver el monitoreo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoreo</h1>
          <p className="text-slate-600">Monitoreo de recursos</p>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border p-2"
        >
          {mikrotiks.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-slate-600">CPU</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{latest ? Math.round(latest.cpuUsage) : 0}%</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-slate-600">RAM</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{latest ? Math.round(latest.ramUsage) : 0}%</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-slate-600">Uptime</p>
          <p className="mt-1 text-xl font-bold">{latest ? formatUptime(latest.uptime) : '-'}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-slate-600">Estado</p>
          <p className="mt-1 text-xl font-bold">
            {mikrotiks.find(m => m.id === selected)?.status === 'online' ? (
              <span className="text-emerald-600">En línea</span>
            ) : (
              <span className="text-red-600">Fuera de línea</span>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Uso de CPU</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} dot={false} name="CPU %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Uso de RAM</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="ram" stroke="#10B981" strokeWidth={2} dot={false} name="RAM %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}