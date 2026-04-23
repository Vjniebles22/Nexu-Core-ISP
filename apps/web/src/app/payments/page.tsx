'use client';

import { useEffect, useState, useTransition } from 'react';
import { DollarSign, Search, CheckCircle, Clock, XCircle, Loader2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { fetchApi } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Client {
  id: string;
  name: string;
  lastName: string;
  email: string;
  dni: string;
  phone: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  period: string;
  dueDate: string;
  paidDate: string | null;
  description: string;
  client: Client;
}

const ITEMS_PER_PAGE = 15;

export default function PaymentBoxPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showBox, setShowBox] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setShowPaymentForm(false);
    setSelectedInvoices([]);
    setCurrentPage(1);

    try {
      const response = await fetchApi<{ data: Invoice[] }>(`/api/invoices?search=${encodeURIComponent(searchQuery)}&status=pending&page=1&limit=${ITEMS_PER_PAGE}`);
      setInvoices(response.data || []);
    } catch (error) {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore(page: number) {
    try {
      const response = await fetchApi<{ data: Invoice[] }>(`/api/invoices?search=${encodeURIComponent(searchQuery)}&status=pending&page=${page}&limit=${ITEMS_PER_PAGE}`);
      setInvoices(prev => [...prev, ...(response.data || [])]);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function toggleInvoice(id: string) {
    setSelectedInvoices(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function selectAllPending() {
    const pending = invoices.filter(i => i.status !== 'paid').map(i => i.id);
    setSelectedInvoices(pending);
  }

  async function processPayment() {
    if (selectedInvoices.length === 0) return;

    const ids = selectedInvoices.join(',');
    setProcessing(true);

    try {
      await fetchApi('/api/portal/pay-invoices', {
        method: 'POST',
        body: JSON.stringify({ 
          invoiceIds: ids,
          paymentMethod,
          paymentRef: paymentRef || null
        }),
      });

      const methodLabel = paymentMethod === 'cash' ? 'Efectivo' : 
                         paymentMethod === 'transfer' ? 'Transferencia' : 
                         paymentMethod === 'deposit' ? 'Depósito' : 
                         paymentMethod === 'card' ? 'Tarjeta' : 'Otro';
      
      await Swal.fire({
        icon: 'success',
        title: 'Pago Registrado',
        html: `
          <p>${selectedInvoices.length} factura(s) marcada(s) como pagada(s)</p>
          <p class="text-sm text-slate-500">Método: ${methodLabel}</p>
          ${paymentRef ? `<p class="text-sm text-slate-500">Referencia: ${paymentRef}</p>` : ''}
        `,
        timer: 3000,
      });

      setSelectedInvoices([]);
      setShowPaymentForm(false);
      setPaymentRef('');
      setPaymentMethod('cash');
      handleSearch(new Event('submit') as any);
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message,
      });
    } finally {
      setProcessing(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-300';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'overdue': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  }

  const totalSelected = selectedInvoices.reduce((sum, id) => {
    const inv = invoices.find(i => i.id === id);
    return sum + (inv ? inv.amount : 0);
  }, 0);

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

  const pendingInvoices = invoices.filter(i => i.status !== 'paid');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Caja de Pagos</h1>
          <p className="text-slate-600">Registrar pagos de facturas</p>
        </div>
        <button
          onClick={() => setShowBox(!showBox)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium"
        >
          {showBox ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showBox ? 'Ocultar' : 'Mostrar'} Caja
        </button>
      </div>

      {showBox && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSearch} className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por DNI, Cédula, Nombre o Apellido..."
                  className="w-full pl-10 rounded-lg border p-3 text-base"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </form>

          {invoices.length === 0 && !loading && searchQuery && (
            <p className="text-slate-500 text-center py-8">No se encontraron facturas pendientes</p>
          )}

          {invoices.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-semibold">{invoices[0].client.name} {invoices[0].client.lastName}</p>
                    <p className="text-sm text-slate-500">DNI: {invoices[0].client.dni} - {invoices[0].client.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Total Pendiente</p>
                  <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingInvoices.reduce((s, i) => s + i.amount, 0))}</p>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={selectAllPending}
                  disabled={pendingInvoices.length === 0}
                  className="text-sm text-blue-600 hover:underline disabled:opacity-50"
                >
                  Seleccionar todos
                </button>
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-500">
                  {selectedInvoices.length} seleccionada(s): {formatCurrency(totalSelected)}
                </span>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium w-10">#</th>
                      <th className="p-3 text-left text-sm font-medium">Periodo</th>
                      <th className="p-3 text-left text-sm font-medium">Descripción</th>
                      <th className="p-3 text-left text-sm font-medium">Vence</th>
                      <th className="p-3 text-right text-sm font-medium">Monto</th>
                      <th className="p-3 text-center text-sm font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr 
                        key={invoice.id} 
                        className={`border-t ${invoice.status !== 'paid' ? 'hover:bg-slate-50 cursor-pointer' : 'bg-slate-50'}`}
                        onClick={() => invoice.status !== 'paid' && toggleInvoice(invoice.id)}
                      >
                        <td className="p-3">
                          {invoice.status !== 'paid' && (
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => toggleInvoice(invoice.id)}
                              className="h-4 w-4"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </td>
                        <td className="p-3 text-sm">Factura {invoice.period}</td>
                        <td className="p-3 text-sm text-slate-600">{invoice.description}</td>
                        <td className="p-3 text-sm">{new Date(invoice.dueDate).toLocaleDateString('es-CO')}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(invoice.amount)}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                            {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Vencida'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedInvoices.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-green-800">
                        Total a registrar: <span className="text-2xl">{formatCurrency(totalSelected)}</span>
                      </p>
                      <p className="text-sm text-green-600">{selectedInvoices.length} factura(s) seleccionada(s)</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentForm(!showPaymentForm)}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                    >
                      <DollarSign className="h-5 w-5" />
                      Registrar Pago
                    </button>
                  </div>

                  {showPaymentForm && (
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="font-medium mb-3">¿Confirmar el pago de estas {selectedInvoices.length} factura(s)?</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Método de Pago</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full rounded-lg border p-2 text-sm"
                          >
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia</option>
                            <option value="deposit">Depósito</option>
                            <option value="card">Tarjeta</option>
                            <option value="other">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            {paymentMethod === 'cash' ? 'Recibo N°' : 
                             paymentMethod === 'transfer' ? 'N° Transferencia' :
                             paymentMethod === 'deposit' ? 'N° Depósito' :
                             paymentMethod === 'card' ? 'N° Autorización' : 'Referencia'}
                          </label>
                          <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder={paymentMethod === 'cash' ? 'Número de recibo' : 
                                         paymentMethod === 'transfer' ? 'Número de transferencia' :
                                         paymentMethod === 'deposit' ? 'Número de depósito' :
                                         paymentMethod === 'card' ? 'Número de autorización' : 'Número de referencia'}
                            className="w-full rounded-lg border p-2 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={processPayment}
                          disabled={processing}
                          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                        >
                          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Confirmar Pago
                        </button>
                        <button
                          onClick={() => setShowPaymentForm(false)}
                          className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Métodos de Pago Disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { name: 'Efectivo', icon: '💵' },
            { name: 'Transferencia', icon: '🏦' },
            { name: 'Depósito', icon: '📁' },
            { name: 'Tarjeta', icon: '💳' },
            { name: 'Otro', icon: '📝' },
          ].map(method => (
            <div key={method.name} className="p-3 bg-slate-50 rounded-lg text-center">
              <p className="text-2xl mb-1">{method.icon}</p>
              <p className="text-sm font-medium">{method.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}