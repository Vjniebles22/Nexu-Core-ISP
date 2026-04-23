'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Contract {
  id: string;
  startDate: string;
  endDate: string | null;
  terms: string | null;
  status: string;
  client: { name: string; lastName: string };
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ clientId: '', startDate: '', endDate: '', terms: '', status: 'active' });

  async function loadData() {
    try {
      const [contractsData, clientsData] = await Promise.all([
        fetchApi<Contract[]>('/api/contracts'),
        fetchApi<any[]>('/api/clients'),
      ]);
      setContracts(contractsData);
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
      await fetchApi('/api/contracts', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      setForm({ clientId: '', startDate: '', endDate: '', terms: '', status: 'active' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar contrato?')) return;
    try {
      await fetchApi(`/api/contracts/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contratos</h1>
          <p className="text-slate-600">Gestión de contratos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : contracts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
          <p className="text-slate-500">No hay contratos</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:underline">Crear el primero</button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Inicio</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Fin</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{contract.client?.name} {contract.client?.lastName}</td>
                  <td className="px-4 py-3 text-sm">{new Date(contract.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Indefinido'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${contract.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(contract.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
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
            <h2 className="mb-4 text-xl font-bold">Nuevo Contrato</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Cliente</label><select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="mt-1 w-full rounded-lg border p-2" required><option value="">Seleccionar</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>)}</select></div>
              <div><label className="block text-sm font-medium">Fecha de inicio</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Fecha de fin</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1 w-full rounded-lg border p-2" /></div>
              <div><label className="block text-sm font-medium">Términos</label><textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="mt-1 w-full rounded-lg border p-2" rows={3} /></div>
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