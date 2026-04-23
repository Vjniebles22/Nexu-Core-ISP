'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Queue {
  id: string;
  name: string;
  maxLimit: string | null;
  maxUpload: string | null;
  priority: number;
  disabled: boolean;
  mikrotik: { id: string; name: string };
  client: { name: string; lastName: string } | null;
}

interface Mikrotik {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  lastName: string;
}

export default function QueuesPage() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMikrotikId, setSelectedMikrotikId] = useState('');
  const [form, setForm] = useState({
    name: '', mikrotikId: '', clientId: '', maxLimit: '', maxUpload: '', priority: 8
  });

  async function loadData() {
    try {
      const [queuesData, mikrotiksData, clientsData] = await Promise.all([
        fetchApi<Queue[]>('/api/queues'),
        fetchApi<Mikrotik[]>('/api/mikrotik'),
        fetchApi<Client[]>('/api/clients'),
      ]);
      setQueues(queuesData);
      setMikrotiks(mikrotiksData);
      setClients(clientsData);
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
      await fetchApi('/api/queues', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      setForm({ name: '', mikrotikId: '', clientId: '', maxLimit: '', maxUpload: '', priority: 8 });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar cola?')) return;
    try {
      await fetchApi(`/api/queues/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleSync() {
    if (!selectedMikrotikId) {
      alert('Selecciona un Mikrotik primero');
      return;
    }
    try {
      const result = await fetchApi<{ success: boolean; message: string; warning?: boolean }>('/api/queues/sync', { 
        method: 'POST', 
        body: JSON.stringify({ mikrotikId: selectedMikrotikId }) 
      });
      
      if (result.warning) {
        alert(result.message);
      } else {
        alert(result.message);
        loadData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Colas</h1>
          <p className="text-slate-600">Gestión de colas de velocidad</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedMikrotikId} onChange={(e) => setSelectedMikrotikId(e.target.value)} className="rounded-lg border px-3 py-2">
            <option value="">Seleccionar Mikrotik</option>
            {mikrotiks.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button onClick={handleSync} disabled={!selectedMikrotikId} className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-slate-50 disabled:opacity-50">
            <RefreshCw className="h-4 w-4" /> Sincronizar
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : queues.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
          <p className="text-slate-500">No hay colas configuradas</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:underline">Agregar la primera</button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Mikrotik</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Descarga</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Subida</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {queues.map((queue) => (
                <tr key={queue.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{queue.name}</td>
                  <td className="px-4 py-3 text-sm">{queue.client ? `${queue.client.name} ${queue.client.lastName}` : '-'}</td>
                  <td className="px-4 py-3 text-sm">{queue.mikrotik.name}</td>
                  <td className="px-4 py-3 text-sm">{queue.maxLimit || '-'}</td>
                  <td className="px-4 py-3 text-sm">{queue.maxUpload || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${queue.disabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {queue.disabled ? 'Deshabilitado' : 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(queue.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
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
            <h2 className="mb-4 text-xl font-bold">Nueva Cola</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Nombre</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Mikrotik</label><select value={form.mikrotikId} onChange={(e) => setForm({...form, mikrotikId: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required><option value="">Seleccionar</option>{mikrotiks.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium">Cliente (opcional)</label><select value={form.clientId} onChange={(e) => setForm({...form, clientId: e.target.value})} className="mt-1 w-full rounded-lg border p-2"><option value="">Seleccionar</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Límite descarga</label><input value={form.maxLimit} onChange={(e) => setForm({...form, maxLimit: e.target.value})} placeholder="ej: 10M" className="mt-1 w-full rounded-lg border p-2" /></div>
                <div><label className="block text-sm font-medium">Límite subida</label><input value={form.maxUpload} onChange={(e) => setForm({...form, maxUpload: e.target.value})} placeholder="ej: 5M" className="mt-1 w-full rounded-lg border p-2" /></div>
              </div>
              <div><label className="block text-sm font-medium">Prioridad (1-8)</label><input type="number" min="1" max="8" value={form.priority} onChange={(e) => setForm({...form, priority: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" /></div>
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