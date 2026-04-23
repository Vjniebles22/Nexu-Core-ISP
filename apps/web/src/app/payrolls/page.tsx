'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { fetchApi } from '@/lib/utils';

interface Payroll {
  id: string;
  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  total: number;
  employee: { name: string; lastName: string };
}

export default function PayrollsPage() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [form, setForm] = useState({ employeeId: '', period: '', baseSalary: 0, bonuses: 0, deductions: 0 });

  async function loadData() {
    try {
      const [payrollsData, employeesData] = await Promise.all([
        fetchApi<Payroll[]>('/api/payrolls'),
        fetchApi<any[]>('/api/employees'),
      ]);
      setPayrolls(payrollsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleCalculate() {
    if (!form.employeeId || !form.period) {
      alert('Seleccione empleado y período');
      return;
    }
    try {
      const result = await fetchApi<any>('/api/payrolls/calculate', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: form.employeeId,
          period: form.period,
          bonuses: form.bonuses,
          deductions: form.deductions,
        }),
      });
      setForm(prev => ({ ...prev, baseSalary: result.baseSalary }));
      alert(`Total a pagar: $${result.total.toFixed(2)}`);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const total = form.baseSalary + form.bonuses - form.deductions;
    try {
      await fetchApi('/api/payrolls', { method: 'POST', body: JSON.stringify({ ...form, total }) });
      setShowModal(false);
      setForm({ employeeId: '', period: '', baseSalary: 0, bonuses: 0, deductions: 0 });
      loadData();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nómina</h1>
          <p className="text-slate-600">Gestión de nóminas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Nueva
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-slate-400" /></div>
      ) : payrolls.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border bg-white">
          <p className="text-slate-500">No hay nóminas</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:underline">Crear la primera</button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Empleado</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Período</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Salario Base</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Bonos</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Deducciones</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{p.employee.name} {p.employee.lastName}</td>
                  <td className="px-4 py-3 text-sm">{p.period}</td>
                  <td className="px-4 py-3">${p.baseSalary.toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-600">+${p.bonuses.toFixed(2)}</td>
                  <td className="px-4 py-3 text-red-600">-${p.deductions.toFixed(2)}</td>
                  <td className="px-4 py-3 font-bold">${p.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Nueva Nómina</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium">Empleado</label><select value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})} className="mt-1 w-full rounded-lg border p-2" required><option value="">Seleccionar</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} {emp.lastName}</option>)}</select></div>
              <div><label className="block text-sm font-medium">Período</label><input value={form.period} onChange={(e) => setForm({...form, period: e.target.value})} placeholder="2026-04" className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Salario Base</label><input type="number" value={form.baseSalary} onChange={(e) => setForm({...form, baseSalary: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" required /></div>
              <div><label className="block text-sm font-medium">Bonos</label><input type="number" value={form.bonuses} onChange={(e) => setForm({...form, bonuses: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" /></div>
              <div><label className="block text-sm font-medium">Deducciones</label><input type="number" value={form.deductions} onChange={(e) => setForm({...form, deductions: Number(e.target.value)})} className="mt-1 w-full rounded-lg border p-2" /></div>
              <button type="button" onClick={handleCalculate} className="w-full rounded-lg border py-2">Calcular</button>
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