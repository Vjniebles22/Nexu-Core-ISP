'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  downloadSpeed: number;
  uploadSpeed: number;
  dataLimit: number;
  price: number;
  priority: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', downloadSpeed: 10, uploadSpeed: 5, dataLimit: 0, price: 0, priority: 8
  });

  async function loadPlans() {
    try {
      const data = await fetchApi<Plan[]>('/api/plans');
      setPlans(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlans(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetchApi('/api/plans', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      setForm({ name: '', downloadSpeed: 10, uploadSpeed: 5, dataLimit: 0, price: 0, priority: 8 });
      loadPlans();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar plan?')) return;
    try {
      await fetchApi(`/api/plans/${id}`, { method: 'DELETE' });
      loadPlans();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-slate-600">Gestión de planes de Internet</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : plans.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
          <p className="text-slate-500">No hay planes configurados</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:underline">Agregar el primero</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{plan.name}</h3>
                  <p className="text-sm text-slate-600">Prioridad: {plan.priority}</p>
                </div>
                <p className="text-xl font-bold text-blue-600">${plan.price}<span className="text-sm font-normal text-slate-500">/mes</span></p>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Descarga</span><span className="font-medium">{plan.downloadSpeed} Mbps</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Subida</span><span className="font-medium">{plan.uploadSpeed} Mbps</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Datos</span><span className="font-medium">{plan.dataLimit === 0 ? 'Ilimitado' : `${plan.dataLimit} MB`}</span></div>
              </div>
              <button onClick={() => handleDelete(plan.id)} className="mt-4 w-full rounded-lg border border-red-200 py-2 text-red-600 hover:bg-red-50">
                <Trash2 className="mx-auto h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Nuevo Plan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Nombre</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Descarga (Mbps)</label><input type="number" value={form.downloadSpeed} onChange={(e) => setForm({...form, downloadSpeed: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" required /></div>
                <div><label className="block text-sm font-medium">Subida (Mbps)</label><input type="number" value={form.uploadSpeed} onChange={(e) => setForm({...form, uploadSpeed: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Límite Datos (MB)</label><input type="number" value={form.dataLimit} onChange={(e) => setForm({...form, dataLimit: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" /><p className="text-xs text-slate-500">0 = Ilimitado</p></div>
                <div><label className="block text-sm font-medium">Precio ($)</label><input type="number" value={form.price} onChange={(e) => setForm({...form, price: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" required /></div>
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