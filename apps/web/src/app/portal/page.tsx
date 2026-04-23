'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, Clock, XCircle, CreditCard, Loader2, Building2, Receipt, User, Mail, Phone, MapPin, Calendar, Wallet } from 'lucide-react';
import { fetchApi } from '@/lib/utils';
import Swal from 'sweetalert2';

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
    email: string;
  };
}

interface Client {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  dni: string;
  plan: {
    name: string;
    downloadSpeed: number;
    uploadSpeed: number;
  };
}

interface PaymentConfig {
  id: string;
  gateway: string;
  enabled: boolean;
  country: string;
  currency: string;
  testMode: boolean;
  publicKey?: string;
  clientId?: string;
}

export default function PortalPage() {
  const [search, setSearch] = useState({ dni: '', email: '' });
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paying, setPaying] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(paymentConfigs[0]?.gateway || '');

  useEffect(() => {
    fetchApi<PaymentConfig[]>('/api/payment-config')
      .then(data => {
        const enabled = data.filter((c: PaymentConfig) => c.enabled);
        setPaymentConfigs(enabled);
        if (enabled.length > 0 && !selectedGateway) {
          setSelectedGateway(enabled[0].gateway);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInvoices([]);
    setClient(null);
    setSearched(false);
    setSelectedInvoices([]);

    try {
      const [invoicesData, clientData] = await Promise.all([
        fetchApi<Invoice[]>(`/api/portal/invoices?dni=${search.dni}&email=${search.email}`),
        fetchApi<Client>(`/api/portal/client/${search.dni}`),
      ]);
      setInvoices(invoicesData);
      setClient(clientData);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'No se encontraron datos');
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se encontraron datos',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePay() {
    if (selectedInvoices.length === 0) return;
    
    const result = await Swal.fire({
      title: 'Confirmar Pago',
      text: `¿Pagar ${selectedInvoices.length} factura(s) por ${formatCurrency(totalPendingSelected)}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, pagar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
    });

    if (!result.isConfirmed) return;
    
    setPaying(true);
    try {
      const config = paymentConfigs.find(c => c.gateway === selectedGateway) || paymentConfigs[0];
      if (!config) {
        throw new Error('No hay pasarela de pago configurada');
      }
      const selectedInvoicesData = invoices.filter(i => selectedInvoices.includes(i.id));
      const total = selectedInvoicesData.reduce((sum, i) => sum + i.amount, 0);
      const invoiceIds = selectedInvoicesData.map(i => i.id).join(',');

      const data = await fetchApi<{ url?: string; error?: string }>('/api/portal/create-payment', {
        method: 'POST',
        body: JSON.stringify({
          gateway: config.gateway,
          amount: total,
          currency: config.currency,
          invoiceIds,
          clientEmail: search.email,
          testMode: config.testMode,
        }),
      });
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        await fetchApi('/api/portal/pay-invoices', {
          method: 'POST',
          body: JSON.stringify({ invoiceIds: selectedInvoices.join(',') }),
        });
        
        const updatedInvoices = await fetchApi<Invoice[]>(`/api/portal/invoices?dni=${search.dni}&email=${search.email}`);
        setInvoices(updatedInvoices);
        setSelectedInvoices([]);
        
        await Swal.fire({
          icon: 'success',
          title: 'Pago Exitoso',
          text: 'Tu pago ha sido procesado correctamente',
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
      });
    } finally {
      setPaying(false);
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

  function getStatusText(status: string) {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencida';
      default: return status;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'paid': return 'bg-green-500 text-white';
      case 'pending': return 'bg-amber-500 text-white';
      case 'overdue': return 'bg-red-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  }

  const pendingInvoices = invoices.filter(i => i.status !== 'paid');
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const totalPendingAll = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.amount, 0);
  const totalPendingSelected = selectedInvoices.reduce((sum, id) => {
    const inv = invoices.find(i => i.id === id);
    return sum + (inv ? inv.amount : 0);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Nexu-Core</h1>
              <p className="text-slate-500 text-sm">Portal de Clientes</p>
            </div>
          </div>
          {searched && client && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="hidden md:inline">Bienvenido,</span>
              <span className="font-semibold">{client.name} {client.lastName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {!searched ? (
          <div className="max-w-md mx-auto mt-8 md:mt-16">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="text-center mb-8">
                <Receipt className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Consulta tus Facturas</h2>
                <p className="text-slate-500">Ingresa tus datos para ver tu historial de pagos</p>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Número de Identificación</label>
                  <input
                    type="text"
                    value={search.dni}
                    onChange={(e) => setSearch({ ...search, dni: e.target.value })}
                    placeholder="DNI o Cédula"
                    className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Correo Electrónico</label>
                  <input
                    type="email"
                    value={search.email}
                    onChange={(e) => setSearch({ ...search, email: e.target.value })}
                    placeholder="tu@email.com"
                    className="w-full rounded-xl border-2 border-slate-200 p-4 text-lg focus:border-blue-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Buscar Facturas
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => { setSearched(false); setInvoices([]); setClient(null); setSelectedInvoices([]); }}
              className="text-blue-600 hover:underline font-medium"
            >
              ← Nueva búsqueda
            </button>

            {client && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{client.name} {client.lastName}</h2>
                      <p className="text-slate-500">{client.dni}</p>
                      {client.plan && (
                        <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                          {client.plan.name} - {client.plan.downloadSpeed}Mbps
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Correo</p>
                        <p className="text-sm font-medium text-slate-700">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Teléfono</p>
                        <p className="text-sm font-medium text-slate-700">{client.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Dirección</p>
                        <p className="text-sm font-medium text-slate-700">{client.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Ciudad</p>
                        <p className="text-sm font-medium text-slate-700">{client.city}, {client.department}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Receipt className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-slate-800">{invoices.length}</p>
                <p className="text-sm text-slate-500">Total Facturas</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Clock className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-amber-600">{pendingInvoices.length}</p>
                <p className="text-sm text-slate-500">Pendientes</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
                <p className="text-3xl font-bold text-green-600">{paidInvoices.length}</p>
                <p className="text-sm text-slate-500">Pagadas</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <Wallet className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <p className="text-xl md:text-2xl font-bold text-amber-600">{formatCurrency(totalPendingSelected)}</p>
                <p className="text-sm text-slate-500">Total Pendiente</p>
              </div>
            </div>

            {paymentConfigs.length > 0 && pendingInvoices.length > 0 && (
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-green-800">
                      Total a pagar: <span className="text-3xl font-bold">{formatCurrency(totalPendingSelected)}</span>
                    </p>
                    <p className="text-sm text-green-600">
                      {selectedInvoices.length} factura{selectedInvoices.length !== 1 ? 's' : ''} seleccionada{selectedInvoices.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3">
                    {paymentConfigs.length > 1 && (
                      <select
                        value={selectedGateway}
                        onChange={(e) => setSelectedGateway(e.target.value)}
                        className="rounded-lg border-2 border-green-300 p-3 text-sm font-medium"
                      >
                        {paymentConfigs.map(c => (
                          <option key={c.id} value={c.gateway}>
                            {c.gateway.charAt(0).toUpperCase() + c.gateway.slice(1).replace('_', ' ')}
                            {c.testMode ? ' (Prueba)' : ''}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={handlePay}
                      disabled={paying || selectedInvoices.length === 0}
                      className="bg-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      {paying ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          Pagar Ahora
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-slate-100 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-800">Historial de Facturas</h3>
                {pendingInvoices.length > 0 && (
                  <button onClick={selectAllPending} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                    Seleccionar todas las pendientes
                  </button>
                )}
              </div>
              
              {pendingInvoices.length > 0 && (
                <div className="bg-amber-50 border-b border-amber-100 px-6 py-3">
                  <h4 className="font-semibold text-amber-800">Facturas Pendientes</h4>
                </div>
              )}
              <div className="divide-y divide-slate-100">
                {pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 md:p-6 flex items-center gap-4 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={() => toggleInvoice(invoice.id)}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">Factura {invoice.period}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusText(invoice.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{invoice.description}</p>
                      <p className="text-xs text-slate-400">
                        Vence: {new Date(invoice.dueDate).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-800">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {paidInvoices.length > 0 && (
                <>
                  <div className="bg-green-50 border-b border-green-100 px-6 py-3">
                    <h4 className="font-semibold text-green-800">Facturas Pagadas</h4>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {paidInvoices.map((invoice) => (
                      <div key={invoice.id} className="p-4 md:p-6 flex items-center gap-4 bg-slate-50">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-800">Factura {invoice.period}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                              {getStatusText(invoice.status)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{invoice.description}</p>
                          <p className="text-xs text-slate-400">
                            Pagado: {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString('es-CO') : '-'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600">{formatCurrency(invoice.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-slate-400 text-sm py-6 border-t">
          <p>¿Necesitas ayuda? Contacta a soporte@nexu-core.com</p>
        </footer>
      </main>
    </div>
  );
}