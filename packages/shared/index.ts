import { z } from 'zod';

export const mikrotikSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  ip: z.string().min(1),
  apiPort: z.number().default(8728),
  apiSslPort: z.number().default(8729),
  username: z.string().min(1),
  password: z.string().min(1),
  useSsl: z.boolean().default(true),
});

export const mikrotikUpdateSchema = mikrotikSchema.partial().extend({
  name: z.string().min(1),
  ip: z.string().min(1),
  username: z.string().min(1),
});

export const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  downloadSpeed: z.number().positive(),
  uploadSpeed: z.number().positive(),
  dataLimit: z.number().nonnegative(),
  price: z.number().nonnegative(),
  priority: z.number().min(1).max(8).default(8),
  queueType: z.enum(['simple', 'pcq', 'fq-codel']).default('simple'),
  burstLimit: z.number().optional(),
  burstThreshold: z.number().optional(),
  minLimit: z.number().optional(),
});

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  idType: z.enum(['CC', 'DNI', 'PASAPORTE', 'CE', 'RUT', 'CI', 'CPP', 'OTRO']).default('CC'),
  dni: z.string().min(1),
  address: z.string().min(1),
  country: z.string().default('CO'),
  department: z.string().optional(),
  city: z.string().optional(),
  planId: z.string(),
  mikrotikId: z.string(),
  pppoeUser: z.string().optional(),
  pppoePassword: z.string().optional(),
  status: z.enum(['active', 'suspended', 'cancelled']).default('active'),
  contractId: z.string().optional(),
  connectionType: z.enum(['pppoe', 'queue']).default('pppoe'),
  syncWithMikrotik: z.boolean().default(true),
});

export const queueSchema = z.object({
  id: z.string().optional(),
  mikrotikId: z.string(),
  clientId: z.string().optional(),
  name: z.string().min(1),
  target: z.string().optional(),
  maxLimit: z.string().optional(),
  maxUpload: z.string().optional(),
  priority: z.number().min(1).max(8).default(8),
  burstLimit: z.string().optional(),
  burstThreshold: z.string().optional(),
  burstTime: z.string().optional(),
  limitAt: z.string().optional(),
  disabled: z.boolean().default(false),
});

export const pppoeSchema = z.object({
  id: z.string().optional(),
  mikrotikId: z.string(),
  clientId: z.string().optional(),
  name: z.string().min(1),
  password: z.string().min(1),
  profile: z.string().default('default'),
  remoteAddress: z.string().optional(),
  localAddress: z.string().optional(),
  disabled: z.boolean().default(false),
});

export const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  dni: z.string().min(1),
  role: z.enum(['admin', 'tecnico', 'soporte', 'facturacion']),
  phone: z.string().optional(),
  salary: z.number().nonnegative(),
  hireDate: z.string().transform((s) => new Date(s)),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const payrollSchema = z.object({
  id: z.string().optional(),
  employeeId: z.string(),
  period: z.string(),
  baseSalary: z.number().nonnegative(),
  bonuses: z.number().nonnegative().default(0),
  deductions: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
});

export const contractSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  terms: z.string().optional(),
  status: z.enum(['active', 'expired', 'terminated']).default('active'),
});

export const invoiceSchema = z.object({
  id: z.string().optional(),
  clientId: z.string(),
  amount: z.number().nonnegative(),
  status: z.enum(['pending', 'paid', 'overdue']).default('pending'),
  dueDate: z.string().transform((s) => new Date(s)),
  paidDate: z.string().transform((s) => new Date(s)).optional(),
  period: z.string(),
  description: z.string().optional(),
});

export const settingsSchema = z.object({
  key: z.string(),
  value: z.string(),
  category: z.string(),
});

export type MikrotikInput = z.infer<typeof mikrotikSchema>;
export type PlanInput = z.infer<typeof planSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type QueueInput = z.infer<typeof queueSchema>;
export type PPPoEInput = z.infer<typeof pppoeSchema>;
export type EmployeeInput = z.infer<typeof employeeSchema>;
export type PayrollInput = z.infer<typeof payrollSchema>;
export type ContractInput = z.infer<typeof contractSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;

export interface MikrotikStats {
  cpuUsage: number;
  ramUsage: number;
  uptime: number;
  rxBytes: number;
  txBytes: number;
}