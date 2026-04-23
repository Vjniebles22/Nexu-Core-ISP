'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CreditCard, Trash2, Plus, Info } from 'lucide-react';
import { fetchApi } from '@/lib/utils';
import Swal from 'sweetalert2';

interface Setting {
  key: string;
  value: string;
  category: string;
}

interface PaymentConfig {
  id: string;
  gateway: string;
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  publicKey?: string;
  accessToken?: string;
  merchantId?: string;
  accountId?: string;
  country: string;
  currency: string;
  testMode: boolean;
  webhookUrl?: string;
}

const GATEWAYS = [
  { value: 'stripe', label: 'Stripe', icon: '💳' },
  { value: 'mercadopago', label: 'Mercado Pago', icon: '🟣' },
  { value: 'wompi', label: 'Wompi', icon: '💲' },
  { value: 'placeto_pay', label: 'PlacetoPay', icon: '💰' },
  { value: 'payu', label: 'PayU', icon: '🏦' },
];

const GATEWAY_FIELDS: Record<string, { key: string; label: string; placeholder: string; required: boolean; help: string }[]> = {
  stripe: [
    { key: 'clientSecret', label: 'Secret Key', placeholder: 'sk_live_...', required: true, help: 'Obtén tu key en Developers > API Keys' },
    { key: 'publicKey', label: 'Public Key', placeholder: 'pk_live_...', required: true, help: 'Obtén tu key en Developers > API Keys' },
    { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://tu-dominio.com/api/portal/webhook/stripe', required: false, help: 'Configura en Webhooks del dashboard' },
  ],
  mercadopago: [
    { key: 'accessToken', label: 'Access Token', placeholder: 'APP_USR-...', required: true, help: 'Obtén en Mercado Pago > Tus Apps > Credentials' },
    { key: 'clientId', label: 'Client ID', placeholder: '123456789', required: false, help: 'App ID de tu integración' },
    { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://tu-dominio.com/api/portal/webhook/mercadopago', required: false, help: 'Configura en	Configuración de notificaciones' },
  ],
  wompi: [
    { key: 'clientSecret', label: 'Secret Key', placeholder: 'prod_sec_key_...', required: true, help: 'Obtén en Wompi Dashboard > Configuración' },
    { key: 'publicKey', label: 'Public Key', placeholder: 'pub_prod_...', required: true, help: 'Obtén en Wompi Dashboard > Configuración' },
  ],
  placeto_pay: [
    { key: 'clientSecret', label: 'API Key', placeholder: 'YourApiKey', required: true, help: 'Obtén en PlacetoPay Dashboard' },
    { key: 'merchantId', label: 'Merchant ID', placeholder: 'merchant_id', required: true, help: 'ID de comercio en PlacetoPay' },
    { key: 'accountId', label: 'Account ID', placeholder: 'account_id', required: false, help: 'ID de cuenta secundaria' },
  ],
  payu: [
    { key: 'clientSecret', label: 'API Key', placeholder: 'ApiKey', required: true, help: 'Obtén en PayU Dashboard' },
    { key: 'merchantId', label: 'Merchant ID', placeholder: ' merchantId', required: true, help: 'ID de comercio en PayU' },
  ],
};

const COUNTRIES = [
  { value: 'CO', label: 'Colombia' },
  { value: 'MX', label: 'México' },
  { value: 'PE', label: 'Perú' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'BR', label: 'Brasil' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadSettings() {
    try {
      const data = await fetchApi<Setting[]>('/api/settings');
      setSettings(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPaymentConfigs() {
    try {
      const data = await fetchApi<PaymentConfig[]>('/api/payment-config');
      setPaymentConfigs(data);
    } catch (error) {
      console.error('Error loading payment configs:', error);
    }
  }

  useEffect(() => { loadSettings(); loadPaymentConfigs(); }, []);

  async function handleSave(key: string, value: string) {
    setSaving(true);
    try {
      const category = settings.find(s => s.key === key)?.category || 'general';
      await fetchApi('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value, category }),
      });
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePaymentConfig(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const config = {
        gateway: formData.get('gateway') as string,
        enabled: formData.get('enabled') === 'on',
        country: formData.get('country') as string,
        currency: formData.get('currency') as string,
        testMode: formData.get('testMode') === 'on',
        clientSecret: formData.get('clientSecret') as string || undefined,
        clientId: formData.get('clientId') as string || undefined,
        publicKey: formData.get('publicKey') as string || undefined,
        accessToken: formData.get('accessToken') as string || undefined,
        merchantId: formData.get('merchantId') as string || undefined,
        accountId: formData.get('accountId') as string || undefined,
        webhookUrl: formData.get('webhookUrl') as string || undefined,
      };
      await fetchApi('/api/payment-config', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      setShowPaymentForm(false);
      setSelectedGateway('stripe');
      await Swal.fire({
        icon: 'success',
        title: 'Guardado',
        text: 'Pasarela configurada correctamente',
        timer: 2000,
      });
      loadPaymentConfigs();
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al guardar',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePaymentConfig(id: string) {
    const result = await Swal.fire({
      title: '¿Eliminar configuración?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    if (!result.isConfirmed) return;
    try {
      await fetchApi(`/api/payment-config/${id}`, { method: 'DELETE' });
      loadPaymentConfigs();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const general = settings.filter(s => s.category === 'general');
  const billing = settings.filter(s => s.category === 'billing');
  const notifications = settings.filter(s => s.category === 'notifications');

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-slate-600">Configuración del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Datos de la Empresa</h2>
          <div className="space-y-4">
            {general.map(setting => (
              <div key={setting.key}>
                <label className="block text-sm font-medium">{setting.key.replace(/_/g, ' ')}</label>
                <input
                  defaultValue={setting.value}
                  onBlur={(e) => handleSave(setting.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border p-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Facturación</h2>
          <div className="space-y-4">
            {billing.map(setting => (
              <div key={setting.key}>
                <label className="block text-sm font-medium">{setting.key.replace(/_/g, ' ')}</label>
                <input
                  defaultValue={setting.value}
                  onBlur={(e) => handleSave(setting.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border p-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Notificaciones</h2>
          <div className="space-y-4">
            {notifications.map(setting => (
              <div key={setting.key}>
                <label className="block text-sm font-medium">{setting.key.replace(/_/g, ' ')}</label>
                <input
                  defaultValue={setting.value}
                  onBlur={(e) => handleSave(setting.key, e.target.value)}
                  className="mt-1 w-full rounded-lg border p-2 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pasarelas de Pago
          </h2>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>

        {paymentConfigs.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay pasarelas configuradas</p>
        ) : (
          <div className="space-y-2">
            {paymentConfigs.map(config => (
              <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{config.gateway}</p>
                  <p className="text-sm text-slate-500">
                    {config.country} - {config.currency} - {config.testMode ? 'Prueba' : 'Producción'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${config.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {config.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => handleDeletePaymentConfig(config.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPaymentForm && (
          <form onSubmit={handleSavePaymentConfig} className="mt-4 p-4 bg-slate-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Gateway</label>
                <select 
                  name="gateway" 
                  required 
                  className="mt-1 w-full rounded-lg border p-2 text-sm"
                  value={selectedGateway}
                  onChange={(e) => setSelectedGateway(e.target.value)}
                >
                  {GATEWAYS.map(g => (
                    <option key={g.value} value={g.value}>{g.icon} {g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">País</label>
                <select name="country" required className="mt-1 w-full rounded-lg border p-2 text-sm">
                  {COUNTRIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Moneda</label>
                <select name="currency" required className="mt-1 w-full rounded-lg border p-2 text-sm">
                  <option value="COP">COP - Peso Colombiano</option>
                  <option value="MXN">MXN - Peso Mexicano</option>
                  <option value="PEN">PEN - Sol Peruano</option>
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="CLP">CLP - Peso Chileno</option>
                  <option value="BRL">BRL - Real Brasileño</option>
                  <option value="USD">USD - Dólar</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input name="testMode" type="checkbox" defaultChecked className="h-4 w-4" />
                <span className="text-sm">Modo Prueba</span>
              </div>
              <div className="flex items-center gap-2">
                <input name="enabled" type="checkbox" defaultChecked className="h-4 w-4" />
                <span className="text-sm">Activo</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Credenciales de {GATEWAYS.find(g => g.value === selectedGateway)?.label}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GATEWAY_FIELDS[selectedGateway]?.map(field => (
                  <div key={field.key} className={field.required ? '' : 'md:col-span-2'}>
                    <label className="block text-sm font-medium">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      name={field.key}
                      type={field.key.includes('Secret') || field.key.includes('Token') || field.key.includes('Key') ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      required={field.required}
                      className="mt-1 w-full rounded-lg border p-2 text-sm font-mono"
                    />
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3" /> {field.help}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowPaymentForm(false); setSelectedGateway('stripe'); }} className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Acerca de Nexu-Core</h2>
        <div className="space-y-2 text-sm text-slate-600">
          <p><span className="font-medium">Versión:</span> 1.0.0</p>
          <p><span className="font-medium">Descripción:</span> Sistema de administración integral para ISPs</p>
          <p><span className="font-medium">Tecnología:</span> Next.js + Express + Prisma</p>
        </div>
      </div>
    </div>
  );
}