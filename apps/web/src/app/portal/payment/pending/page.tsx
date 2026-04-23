'use client';

import { Clock, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentPendingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-12 w-12 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Pago Pendiente</h1>
        <p className="text-slate-500 mb-6">
          Tu pago está siendo procesado. Te notificaremos cuando se confirme.
        </p>

        <div className="space-y-3">
          <Link
            href="/portal"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="h-5 w-5" />
            Volver al Portal
          </Link>
          
          <Link
            href="/portal"
            className="flex items-center justify-center gap-2 w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            Consultar Estado
          </Link>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Si no recibes confirmación en 24hrs, contacta a soporte@nexu-core.com
        </p>
      </div>
    </div>
  );
}