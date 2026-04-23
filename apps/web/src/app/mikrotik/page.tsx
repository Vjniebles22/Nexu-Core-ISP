'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Mikrotik {
  id: string;
  name: string;
  ip: string;
  apiPort: number;
  apiSslPort: number;
  username: string;
  password: string;
  useSsl: boolean;
  status: string;
  lastConnected: string | null;
}

export default function MikrotikPage() {
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [form, setForm] = useState({
    name: '', ip: '', apiPort: 8728, apiSslPort: 8729, username: '', password: '', useSsl: true
  });

  async function loadMikrotiks() {
    try {
      const data = await fetchApi<Mikrotik[]>('/api/mikrotik');
      setMikrotiks(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMikrotiks(); }, []);

  const resetForm = () => {
    setForm({ name: '', ip: '', apiPort: 8728, apiSslPort: 8729, username: '', password: '', useSsl: true });
    setEditMode(false);
    setEditId(null);
  };

  const openEdit = (mk: Mikrotik) => {
    setForm({
      name: mk.name,
      ip: mk.ip,
      apiPort: mk.apiPort,
      apiSslPort: mk.apiSslPort,
      username: mk.username,
      password: '',
      useSsl: mk.useSsl
    });
    setEditMode(true);
    setEditId(mk.id);
    setShowModal(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editMode && editId) {
        await fetchApi(`/api/mikrotik/${editId}`, { method: 'PUT', body: JSON.stringify(form) });
      } else {
        await fetchApi('/api/mikrotik', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowModal(false);
      resetForm();
      loadMikrotiks();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar Mikrotik?')) return;
    try {
      await fetchApi(`/api/mikrotik/${id}`, { method: 'DELETE' });
      loadMikrotiks();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setTestResult(null);
    
    try {
      const result = await fetchApi<{ success: boolean; status: string; message: string }>(`/api/mikrotik/${id}/test`, { method: 'POST' });
      setTestResult({
        id,
        success: result.success,
        message: result.message
      });
      loadMikrotiks();
    } catch (error: any) {
      setTestResult({
        id,
        success: false,
        message: error.message || 'Error de conexión'
      });
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mikrotik</h1>
          <p className="text-slate-600">Gestión de routers Mikrotik</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : mikrotiks.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
          <WifiOff className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500">No hay Mikrotiks configurados</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:underline">Agregar el primero</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mikrotiks.map((mk) => (
            <div key={mk.id} className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {mk.status === 'online' ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    {mk.name}
                  </h3>
                  <p className="text-sm text-slate-600">{mk.ip}:{mk.apiPort}</p>
                  <p className="text-xs text-slate-400">Usuario: {mk.username}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  mk.status === 'online' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {mk.status === 'online' ? 'En línea' : 'Desconectado'}
                </span>
              </div>

              {testResult?.id === mk.id && (
                <div className={`mt-3 rounded-lg p-3 text-sm ${
                  testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {testResult.message}
                </div>
              )}

              {mk.lastConnected && (
                <p className="mt-2 text-xs text-slate-400">
                  Última conexión: {new Date(mk.lastConnected).toLocaleString('es-ES')}
                </p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleTest(mk.id)}
                  disabled={testingId === mk.id}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200 disabled:opacity-50"
                >
                  {testingId === mk.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4" />
                      Probar Conexión
                    </>
                  )}
                </button>
                <button
                  onClick={() => openEdit(mk)}
                  className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(mk.id)}
                  className="rounded-lg bg-red-100 px-3 py-1.5 text-sm text-red-700 hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">{editMode ? 'Editar Mikrotik' : 'Nuevo Mikrotik'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">IP / Host</label>
                <input value={form.ip} onChange={(e) => setForm({...form, ip: e.target.value})} className="mt-1 w-full rounded-lg border p-2" placeholder="192.168.1.1" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Puerto API (HTTP)</label>
                  <input type="number" value={form.apiPort} onChange={(e) => setForm({...form, apiPort: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Puerto API (SSL)</label>
                  <input type="number" value={form.apiSslPort} onChange={(e) => setForm({...form, apiSslPort: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Usuario</label>
                <input value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useSsl"
                  checked={form.useSsl}
                  onChange={(e) => setForm({...form, useSsl: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <label htmlFor="useSsl" className="text-sm font-medium">Usar conexión SSL/TLS</label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="rounded-lg border px-4 py-2">Cancelar</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">{editMode ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}