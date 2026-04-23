'use client';

import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Home, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  period: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    async function processPayment() {
      const invoiceIds = searchParams.get('invoices');
      if (!invoiceIds) {
        setLoading(false);
        return;
      }

      const ids = invoiceIds.split(',').filter(Boolean);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      try {
        await fetchApi('/api/portal/pay-invoices', {
          method: 'POST',
          body: JSON.stringify({ invoiceIds: ids.join(',') }),
        });

        const data = await fetchApi<Invoice[]>(`/api/portal/invoices-by-ids?ids=${invoiceIds}`);
        setInvoices(data);
        setUpdated(true);
      } catch (error) {
        console.error('Error updating invoices:', error);
      } finally {
        setLoading(false);
      }
    }

    processPayment();
  }, [searchParams]);

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Procesando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">¡Pago Exitoso!</h1>
        <p className="text-slate-500 mb-6">
          {updated ? 'Tu pago ha sido procesado correctamente' : 'Pago confirmado'}
        </p>

        {invoices.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500 mb-2">Facturas pagadas:</p>
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">Factura {inv.period}</span>
                  <span className="font-semibold">{formatCurrency(inv.amount)}</span>
                </div>
              ))}
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        )}

        <a
          href="/portal"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
        >
          <Home className="h-5 w-5" />
          Volver al Portal
        </a>

        <p className="text-xs text-slate-400 mt-6">
          Recibirás un correo de confirmación pronto
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}