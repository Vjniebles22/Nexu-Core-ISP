'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Search, X } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
  idType: string;
  dni: string;
  address: string;
  country: string;
  department: string;
  city: string;
  pppoeUser: string;
  pppoePassword: string;
  status: string;
  connectionType: string;
  plan: { id: string; name: string };
  mikrotik: { id: string; name: string };
}

interface Plan {
  id: string;
  name: string;
}

interface Mikrotik {
  id: string;
  name: string;
}

const LATAM_COUNTRIES = [
  { code: 'AR', name: 'Argentina', states: ['Buenos Aires', 'Cordoba', 'Santa Fe', 'Mendoza', 'Tucuman', 'Entre Rios', 'Salta', 'Misiones', 'Neuquen', 'Chaco'] },
  { code: 'BO', name: 'Bolivia', states: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Tarija', 'Potosi', 'Oruro', 'Beni', 'Pando'] },
  { code: 'BR', name: 'Brasil', states: ['Sao Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Pernambuco', 'Ceara', 'Parana', 'Rio Grande do Sul', 'Maranhao'] },
  { code: 'CL', name: 'Chile', states: ['Santiago', 'Valparaiso', 'Concepcion', 'La Serena', 'Antofagasta', 'Temuco', 'Puerto Montt', 'Iquique'] },
  { code: 'CO', name: 'Colombia', states: ['Bogota D.C.', 'Antioquia', 'Valle del Cauca', 'Cundinamarca', 'Atlantico', 'Santander', 'Cordoba', 'Narino', 'Tolima', 'Huila'] },
  { code: 'CR', name: 'Costa Rica', states: ['San Jose', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limon'] },
  { code: 'CU', name: 'Cuba', states: ['La Habana', 'Santiago de Cuba', 'Holguin', 'Camaguey', 'Cienfuegos', 'Villa Clara'] },
  { code: 'DO', name: 'Republica Dominicana', states: ['Santo Domingo', 'Santiago', 'La Altagracia', 'San Cristobal', 'La Vega', 'Puerto Plata', 'Espaillat'] },
  { code: 'EC', name: 'Ecuador', states: ['Pichincha', 'Guayas', 'Manabi', 'Loja', 'Carchi', 'Imbabura', 'Cotopaxi', 'Tungurahua'] },
  { code: 'SV', name: 'El Salvador', states: ['San Salvador', 'Santa Ana', 'San Miguel', 'La Libertad', 'Sonsonate', 'Ahuachapan'] },
  { code: 'GT', name: 'Guatemala', states: ['Guatemala', 'Escuintla', 'Suchitepequez', 'Retalhuleu', 'San Marcos', 'Quetzaltenango', 'Huehuetenango'] },
  { code: 'HN', name: 'Honduras', states: ['Tegucigalpa', 'San Pedro Sula', 'Cortez', 'Francisco Morazan', 'Atlantida', 'Colon'] },
  { code: 'MX', name: 'Mexico', states: ['Ciudad de Mexico', 'Jalisco', 'Nuevo Leon', 'Puebla', 'Veracruz', 'Guanajuato', 'Sonora', 'Chihuahua'] },
  { code: 'NI', name: 'Nicaragua', states: ['Managua', 'Leon', 'Granada', 'Masaya', 'Matagalpa', 'Esteli', 'Chinandega'] },
  { code: 'PA', name: 'Panama', states: ['Panama', 'Colon', 'Bocas del Toro', 'Chiriqui', 'Los Santos', 'Herrera'] },
  { code: 'PY', name: 'Paraguay', states: ['Asuncion', 'Central', 'Alto Parana', 'Itapua', 'Caaguazu', 'Cordillera'] },
  { code: 'PE', name: 'Peru', states: ['Lima', 'Arequipa', 'Cuzco', 'Trujillo', 'Chiclayo', 'Huanuco', 'Puno', 'Tacna', 'Ica'] },
  { code: 'UY', name: 'Uruguay', states: ['Montevideo', 'Canelones', 'Maldonado', 'Salto', 'Paysandu', 'Rivera', 'Cerro Largo'] },
  { code: 'VE', name: 'Venezuela', states: ['Caracas', 'Miranda', 'Lar', 'Valle del Tachira', 'Anzoategui', 'Monagas', 'Sucre', 'Bolivar'] },
];

const getCountry = (code: string) => LATAM_COUNTRIES.find(c => c.code === code);

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mikrotiks, setMikrotiks] = useState<Mikrotik[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('CO');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [form, setForm] = useState({
    name: '', lastName: '', email: '', phone: '', dni: '', address: '',
    planId: '', mikrotikId: '', pppoeUser: '', pppoePassword: '', status: 'active',
    country: 'CO', department: '', city: '', idType: 'CC',
    connectionType: 'pppoe', syncWithMikrotik: false
  });

  const currentCountry = getCountry(selectedCountry);

  async function loadData() {
    try {
      const [clientsData, plansData, mikrotiksData] = await Promise.all([
        fetchApi<Client[]>('/api/clients'),
        fetchApi<Plan[]>('/api/plans'),
        fetchApi<Mikrotik[]>('/api/mikrotik'),
      ]);
      setClients(clientsData);
      setPlans(plansData);
      setMikrotiks(mikrotiksData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({
      name: '', lastName: '', email: '', phone: '', dni: '', address: '',
      planId: '', mikrotikId: '', pppoeUser: '', pppoePassword: '', status: 'active',
      country: 'CO', department: '', city: '', idType: 'CC',
      connectionType: 'pppoe', syncWithMikrotik: false
    });
    setSelectedCountry('CO');
    setEditMode(false);
    setEditId(null);
  };

  const openEdit = (client: Client) => {
    setForm({
      name: client.name,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      idType: client.idType || 'CC',
      dni: client.dni,
      address: client.address,
      planId: client.plan?.id || '',
      mikrotikId: client.mikrotik?.id || '',
      pppoeUser: client.pppoeUser,
      pppoePassword: '',
      status: client.status,
      country: client.country || 'CO',
      department: client.department || '',
      city: client.city || '',
      connectionType: 'pppoe',
      syncWithMikrotik: false
    });
    setSelectedCountry(client.country || 'CO');
    setEditMode(true);
    setEditId(client.id);
    setShowModal(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = { ...form, country: selectedCountry };
      
      if (editMode && editId) {
        await fetchApi(`/api/clients/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/api/clients', { method: 'POST', body: JSON.stringify(payload) });
      }
      
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar cliente?')) return;
    try {
      await fetchApi(`/api/clients/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const filteredClients = clients.filter(c => 
    `${c.name} ${c.lastName} ${c.email} ${c.pppoeUser}`.toLowerCase().includes(search.toLowerCase())
  );

  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-slate-600">Gestion de clientes</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="h-10 w-full rounded-lg border pl-10 pr-4" />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : (
<div className="rounded-lg border bg-white">
            <table className="w-full">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Identificacion</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Pais</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client) => (
                  <tr key={client.id} className="border-b">
                    <td className="px-4 py-3">
                      <p className="font-medium">{client.name} {client.lastName}</p>
                      <p className="text-sm text-slate-500">{client.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">{client.idType}</span>
                      <p className="text-xs text-slate-500">{client.dni}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${client.connectionType === 'pppoe' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {client.connectionType === 'pppoe' ? 'PPPoE' : 'Queue'}
                      </span>
                      {client.connectionType === 'pppoe' && (
                        <p className="text-xs text-slate-500 mt-1">{client.pppoeUser}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">{getCountry(client.country || 'CO')?.name || client.country}</td>
                    <td className="px-4 py-3 text-sm">{client.plan?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(client)} className="text-blue-600 hover:text-blue-700 mr-2"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-slate-500">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredClients.length)} de {filteredClients.length}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-500">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editMode ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Nombre</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
                <div><label className="block text-sm font-medium">Apellido</label><input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
                <div><label className="block text-sm font-medium">Telefono</label><input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Tipo de Identificacion</label><select value={form.idType} onChange={(e) => setForm({...form, idType: e.target.value})} className="mt-1 w-full rounded-lg border p-2"><option value="CC">Cedula de Ciudadania (CC)</option><option value="DNI">Documento Nacional (DNI)</option><option value="PASAPORTE">Pasaporte</option><option value="CE">Cedula de Extranjeria (CE)</option><option value="RUT">RUT</option><option value="CI">Cedula de Identidad (CI)</option><option value="CPP">Cedula Personal Privada (CPP)</option><option value="CPF">CPF (Brasil)</option><option value="NIT">NIT</option><option value="OTRO">Otro</option></select></div>
                <div><label className="block text-sm font-medium">Numero de Identificacion</label><input value={form.dni} onChange={(e) => setForm({...form, dni: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              </div>
               
              <div><label className="block text-sm font-medium">Direccion</label><input value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Pais</label>
                  <select value={selectedCountry} onChange={(e) => { setSelectedCountry(e.target.value); setForm({...form, country: e.target.value, department: ''}); }} className="mt-1 w-full rounded-lg border p-2">
                    {LATAM_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Estado/Provincia/Depto</label>
                  <select value={form.department} onChange={(e) => setForm({...form, department: e.target.value})} className="mt-1 w-full rounded-lg border p-2">
                    <option value="">Seleccionar</option>
                    {currentCountry?.states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Ciudad</label>
                  <input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} className="mt-1 w-full rounded-lg border p-2" placeholder="Ciudad" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Plan</label><select value={form.planId} onChange={(e) => setForm({...form, planId: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required><option value="">Seleccionar</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium">Mikrotik</label><select value={form.mikrotikId} onChange={(e) => setForm({...form, mikrotikId: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required><option value="">Seleccionar</option>{mikrotiks.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
              </div>

              {form.connectionType === 'pppoe' && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium">Usuario (opcional)</label><input value={form.pppoeUser} onChange={(e) => setForm({...form, pppoeUser: e.target.value})} className="mt-1 w-full rounded-lg border p-2" placeholder="Se genera automaticamente" /></div>
                  <div><label className="block text-sm font-medium">Password (opcional)</label><input type="password" value={form.pppoePassword} onChange={(e) => setForm({...form, pppoePassword: e.target.value})} className="mt-1 w-full rounded-lg border p-2" placeholder="Se genera automaticamente" /></div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Tipo de Conexion</label>
                  <select value={form.connectionType} onChange={(e) => setForm({...form, connectionType: e.target.value})} className="mt-1 w-full rounded-lg border p-2">
                    <option value="pppoe">PPPoE</option>
                    <option value="queue">Queue</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="syncWithMikrotik"
                    checked={form.syncWithMikrotik}
                    onChange={(e) => setForm({...form, syncWithMikrotik: e.target.checked})}
                    className="rounded"
                  />
                  <label htmlFor="syncWithMikrotik" className="text-sm">Sincronizar con Mikrotik</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Estado</label>
                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})} className="mt-1 w-full rounded-lg border p-2">
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="rounded-lg border px-4 py-2">Cancelar</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">{editMode ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}