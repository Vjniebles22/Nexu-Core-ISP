'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
  lastName: string;
  email: string;
  dni: string;
  role: string;
  phone: string | null;
  salary: number;
  status: string;
  hireDate: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', lastName: '', email: '', dni: '', role: 'tecnico', phone: '', salary: 0, hireDate: '', status: 'active' });

  async function loadEmployees() {
    try {
      const data = await fetchApi<Employee[]>('/api/employees');
      setEmployees(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEmployees(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetchApi('/api/employees', { method: 'POST', body: JSON.stringify(form) });
      setShowModal(false);
      setForm({ name: '', lastName: '', email: '', dni: '', role: 'tecnico', phone: '', salary: 0, hireDate: '', status: 'active' });
      loadEmployees();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar empleado?')) return;
    try {
      await fetchApi(`/api/employees/${id}`, { method: 'DELETE' });
      loadEmployees();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Personal</h1>
          <p className="text-slate-600">Gestión de empleados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : employees.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
          <p className="text-slate-500">No hay empleados</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:underline">Agregar el primero</button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">DNI</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Rol</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Salario</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{emp.name} {emp.lastName}</td>
                  <td className="px-4 py-3 text-sm">{emp.email}</td>
                  <td className="px-4 py-3 text-sm">{emp.dni}</td>
                  <td className="px-4 py-3 text-sm capitalize">{emp.role}</td>
                  <td className="px-4 py-3 font-medium">${emp.salary}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${emp.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
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
            <h2 className="mb-4 text-xl font-bold">Nuevo Empleado</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Nombre</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
                <div><label className="block text-sm font-medium">Apellido</label><input value={form.lastName} onChange={(e) => setForm({...form, lastName: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Email</label><input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
                <div><label className="block text-sm font-medium">DNI</label><input value={form.dni} onChange={(e) => setForm({...form, dni: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Rol</label><select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="mt-1 w-full rounded-lg border p-2"><option value="admin">Admin</option><option value="tecnico">Técnico</option><option value="soporte">Soporte</option><option value="facturacion">Facturación</option></select></div>
                <div><label className="block text-sm font-medium">Teléfono</label><input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="mt-1 w-full rounded-lg border p-2" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium">Salario</label><input type="number" value={form.salary} onChange={(e) => setForm({...form, salary: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" required /></div>
                <div><label className="block text-sm font-medium">Fecha de contratación</label><input type="date" value={form.hireDate} onChange={(e) => setForm({...form, hireDate: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              </div>
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