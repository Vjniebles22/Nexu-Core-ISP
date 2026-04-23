'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface PPPoE {
  id: string;
  name: string;
  password: string;
  profile: string;
  disabled: boolean;
  mikrotik: { id: string; name: string };
  client: { name: string; lastName: string } | null;
}

export default function PPPoEPage() {
  const [secrets, setSecrets] = useState<PPPoE[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', password: '', mikrotikId: '', clientId: '', profile: 'default' });

  async function loadData() {
    try {
      const [secretsData, mikrotiksData, clientsData] = await Promise.all([
        fetchApi<PPPoE[]>('/api/pppoe'),
        fetchApi<any[]>('/api/mikrotik'),
        fetchApi<any[]>('/api/clients'),
      ]);
      setSecrets(secretsData);
      (window as any).mikrotiks = mikrotiksData;
      (window as any).clients = clientsData;
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetchApi('/api/pppoe', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      setForm({ name: '', password: '', mikrotikId: '', clientId: '', profile: 'default' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar secreto PPPoE?')) return;
    try {
      await fetchApi(`/api/pppoe/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PPPoE</h1>
          <p className="text-slate-600">Gestión de секреты PPPoE</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : secrets.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
          <p className="text-slate-500">No hay secretos PPPoE</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:underline">Agregar el primero</button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Usuario</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Mikrotik</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Perfil</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((secret) => (
                <tr key={secret.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{secret.name}</td>
                  <td className="px-4 py-3 text-sm">{secret.client ? `${secret.client.name} ${secret.client.lastName}` : '-'}</td>
                  <td className="px-4 py-3 text-sm">{secret.mikrotik.name}</td>
                  <td className="px-4 py-3 text-sm">{secret.profile}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${secret.disabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {secret.disabled ? 'Deshabilitado' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(secret.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Nuevo Secreto PPPoE</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Usuario</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Password</label><input value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Mikrotik</label><select value={form.mikrotikId} onChange={(e) => setForm({...form, mikrotikId: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required><option value="">Seleccionar</option>{(window as any).mikrotiks?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium">Cliente</label><select value={form.clientId} onChange={(e) => setForm({...form, clientId: e.target.value})} className="mt-1 w-full rounded-lg border p-2"><option value="">Seleccionar</option>{(window as any).clients?.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>)}</select></div>
              <div><label className="block text-sm font-medium">Perfil</label><input value={form.profile} onChange={(e) => setForm({...form, profile: e.target.value})} className="mt-1 w-full rounded-lg border p-2" /></div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2">Cancelar</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}