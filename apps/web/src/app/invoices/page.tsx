'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, CheckCircle } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  period: string;
  dueDate: string;
  paidDate: string | null;
  client: { name: string; lastName: string };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [form, setForm] = useState({ clientId: '', amount: 0, period: '', dueDate: '' });

  async function loadInvoices() {
    try {
      const response = await fetchApi<{ data: Invoice[] } | Invoice[]>('/api/invoices');
      const data = Array.isArray(response) ? response : response.data;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInvoices(); }, []);
  useEffect(() => { setCurrentPage(1); }, [invoices.length]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = { ...form, status: 'pending' };
      await fetchApi('/api/invoices', { method: 'POST', body: JSON.stringify(data) });
      setShowModal(false);
      setForm({ clientId: '', amount: 0, period: '', dueDate: '' });
      loadInvoices();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handlePay(id: string) {
    try {
      await fetchApi(`/api/invoices/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'paid', paidDate: new Date().toISOString() }) });
      loadInvoices();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleGenerate() {
    try {
      await fetchApi('/api/invoices/generate', { method: 'POST', body: JSON.stringify({}) });
      alert('Facturas generadas');
      loadInvoices();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const pending = invoices.filter(i => i.status === 'pending');
  const paid = invoices.filter(i => i.status === 'paid');
  const totalPending = pending.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-slate-600">Gestión de facturas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleGenerate} className="flex items-center gap-2 rounded-lg border px-4 py-2 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" /> Generar
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Nueva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-slate-600">Pendientes</p>
          <p className="mt-1 text-2xl font-bold">{pending.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-slate-600">Pagadas</p>
          <p className="mt-1 text-2xl font-bold">{paid.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <p className="text-sm text-slate-600">Total Pendiente</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">${totalPending.toFixed(2)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Período</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Monto</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Vencimiento</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((invoice) => (
                <tr key={invoice.id} className="border-b">
                  <td className="px-4 py-3">{invoice.client.name} {invoice.client.lastName}</td>
                  <td className="px-4 py-3 text-sm">{invoice.period}</td>
                  <td className="px-4 py-3 font-medium">${invoice.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {invoice.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {invoice.status === 'pending' && (
                      <button onClick={() => handlePay(invoice.id)} className="text-emerald-600 hover:text-emerald-700">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-slate-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, invoices.length)} de {invoices.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">Anterior</button>
                <span className="px-3 py-1 text-sm text-slate-500">{currentPage} / {Math.ceil(invoices.length / itemsPerPage)}</span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(invoices.length / itemsPerPage), p + 1))} disabled={currentPage >= Math.ceil(invoices.length / itemsPerPage)} className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50">Siguiente</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Nueva Factura</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Cliente</label><input value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Monto</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Período</label><input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="2026-04" className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Vencimiento</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="mt-1 w-full rounded-lg border p-2" required /></div>
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