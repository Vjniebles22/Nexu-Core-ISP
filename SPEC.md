# Nexu-Core - Sistema de Administración Mikrotik ISP

## 1. Project Overview

**Project Name:** Nexu-Core
**Project Type:** Full-stack Web Application (Monorepo)
**Core Functionality:** Sistema integral de administración para proveedores de Internet (ISP) que gestiona Mikrotik RouterOS, incluyendo gestión de clientes, facturación, monitoreo y administración de personal.
**Target Users:** Administradores de ISPs, técnicos de redes, personal de soporte y facturación.

## 2. Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** SQLite (desarrollo) / MySQL (producción)
- **Libraries:**
  - `routeros-client` - Conexión a Mikrotik API
  - `node-schedule` - Programación de tareas
  - `socket.io` - Tiempo real

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + Shadcn UI
- **Charts:** Recharts
- **State:** React Query + Zustand
- **Forms:** React Hook Form + Zod

## 3. Architecture

```
nexu-core/
├── apps/
│   ├── api/          # Backend Express
│   └── web/          # Frontend Next.js
├── packages/
│   ├── database/     # Prisma schema y seeders
│   └── shared/       # Tipos y utilidades compartidas
└── turbo.json       # Turborepo config
```

## 4. Data Models

### Mikrotik Connection
- id, name, ip, apiPort, username, encryptedPassword, status, lastConnected, createdAt, updatedAt

### Client (Cliente)
- id, name, lastName, email, phone, dni, address, planId, mikrotikId, pppoeUser, pppoePassword, status, contractId, createdAt, updatedAt

### Plan (Plan)
- id, name, downloadSpeed, uploadSpeed, dataLimit (MB), price, priority, queueType, createdAt

### Invoice (Factura)
- id, clientId, amount, status, dueDate, paidDate, period, createdAt

### NetworkStatistics (Estadísticas)
- id, mikrotikId, cpuUsage, ramUsage, uptime, timestamp

### Queue (Cola Mikrotik)
- id, mikrotikId, name, target, maxLimit, priority, clientId, createdAt

### PPPoE Secret
- id, mikrotikId, name, password, profile, clientId, remoteAddress, createdAt

### Employee (Personal)
- id, name, lastName, email, dni, role, salary, hireDate, status, createdAt

### Payroll (Nómina)
- id, employeeId, period, baseSalary, bonuses, deductions, total, createdAt

### Contract (Contrato)
- id, clientId, startDate, endDate, terms, status, createdAt

### SystemSettings (Configuración)
- id, key, value, category, updatedAt

## 5. Modules

### 5.1 Mikrotik Manager
- **Funcionalidad:** Conexión y gestión de múltiples routers Mikrotik
- **Características:**
  - Agregar/editar/elimiar conexiones Mikrotik
  - Conexión API segura con ssl/tls
  - Monitoreo de estado en tiempo real
  - Test de conectividad

### 5.2 Queue & PPPoE Manager
- **Funcionalidad:** Gestión de colas de velocidad y usuarios PPPoE
- **Características:**
  - Crear/editar/eliminar colas Simple Queue
  - Crear/editar/eliminar secretos PPPoE
  - Asignar perfiles de velocidad
  - Sincronización bidireccional con Mikrotik

### 5.3 Client Manager
- **Funcionalidad:** CRUD completo de clientes
- **Características:**
  - Registro de clientes con documentación
  - Asignación de plan y Mikrotik
  - Generación automática de credenciales PPPoE
  - Historial de conexiones

### 5.4 Plan Manager
- **Funcionalidad:** Gestión de planes de Internet
- **Características:**
  - Planes con límite de descarga/subida
  - Prioridad de cola
  - Precio mensual configurable

### 5.5 Billing (Facturación)
- **Funcionalidad:** Sistema de facturación mensual
- **Características:**
  - Generación automática de facturas
  - Estados: pendiente, pagado, vencido
  - Período mensual
  - Historial de pagos

### 5.6 Monitoring
- **Funcionalidad:** Monitoreo en tiempo real de Mikrotik
- **Características:**
  - CPU usage (gráfica)
  - RAM usage (gráfica)
  - Uptime
  - Interfaces activo
  - Conexiones activas
  - Historial de métricas

### 5.7 Employee Manager
- **Funcionalidad:** Gestión de personal
- **Características:**
  - CRUD de empleados
  - Roles: admin, técnico, soporte, facturación
  - Información de contacto

### 5.8 Payroll (Nómina)
- **Funcionalidad:** Sistema de nómina
- **Características:**
  - Registro de salarios
  - Bonos y deducciones
  - Cálculo automático
  - Períodos de pago

### 5.9 Contract Manager
- **Funcionalidad:** Gestión de contratos
- **Características:**
  - Créación de contratos
  - Fechas de inicio/fin
  - Términos y condiciones
  - Estado del contrato

### 5.10 Settings
- **Funcionalidad:** Configuración del sistema
- **Características:**
  - Configuración general
  - Configuración de facturación
  - Configuración de notificaciones
  - Datos de la empresa

## 6. API Endpoints

### Mikrotik
- `GET /api/mikrotik` - Listar Mikrotiks
- `POST /api/mikrotik` - Crear Mikrotik
- `GET /api/mikrotik/:id` - Obtener Mikrotik
- `PUT /api/mikrotik/:id` - Actualizar Mikrotik
- `DELETE /api/mikrotik/:id` - Eliminar Mikrotik
- `POST /api/mikrotik/:id/test` - Probar conexión

### Colas
- `GET /api/queues` - Listar colas
- `POST /api/queues` - Crear cola
- `PUT /api/queues/:id` - Actualizar cola
- `DELETE /api/queues/:id` - Eliminar cola
- `POST /api/queues/sync` - Sincronizar con Mikrotik

### PPPoE
- `GET /api/pppoe` - Listar secretos
- `POST /api/pppoe` - Crear secreto
- `PUT /api/pppoe/:id` - Actualizar secreto
- `DELETE /api/pppoe/:id` - Eliminar secreto

### Clientes
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `GET /api/clients/:id` - Obtener cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Planes
- `GET /api/plans` - Listar planes
- `POST /api/plans` - Crear plan
- `PUT /api/plans/:id` - Actualizar plan
- `DELETE /api/plans/:id` - Eliminar plan

### Facturación
- `GET /api/invoices` - Listar facturas
- `POST /api/invoices` - Crear factura
- `PUT /api/invoices/:id` - Actualizar factura
- `GET /api/invoices/generate` - Generar facturas mensuales

### Monitoreo
- `GET /api/monitoring/:mikrotikId` - Obtener métricas
- `GET /api/monitoring/:mikrotikId/history` - Obtener historial
- `WS /api/monitoring/stream` - WebSocket de métricas en tiempo real

### Personal
- `GET /api/employees` - Listar empleados
- `POST /api/employees` - Crear empleado
- `PUT /api/employees/:id` - Actualizar empleado
- `DELETE /api/employees/:id` - Eliminar empleado

### Nómina
- `GET /api/payrolls` - Listar nóminas
- `POST /api/payrolls` - Crear nómina
- `GET /api/payrolls/calculate` - Calcular nómina

### Contratos
- `GET /api/contracts` - Listar contratos
- `POST /api/contracts` - Crear contrato
- `PUT /api/contracts/:id` - Actualizar contrato

### Configuración
- `GET /api/settings` - Obtener configuración
- `PUT /api/settings` - Actualizar configuración

## 7. UI/UX Design

### Color Palette
- **Primary:** #0F172A (slate-900)
- **Secondary:** #3B82F6 (blue-500)
- **Accent:** #10B981 (emerald-500)
- **Background:** #F8FAFC (slate-50)
- **Surface:** #FFFFFF
- **Error:** #EF4444 (red-500)
- **Warning:** #F59E0B (amber-500)
- **Success:** #22C55E (green-500)

### Typography
- **Font Family:** Inter
- **Headings:** font-bold
- **Body:** font-normal

### Layout
- **Sidebar:** Fija a la izquierda, 256px ancho
- **Header:** Fija arriba, contenido principal scrollable
- **Responsive:** Mobile sidebar colapsable

### Components
- Cards con shadow-sm
- Buttons con bordes redondeados
- Forms con validación
- Tables con paginación
- Charts con tooltips

## 8. Acceptance Criteria

1. ✅ Sistema conecta a Mikrotik vía API RouterOS
2. ✅ CRUD completo de clientes, planes, facturación
3. ✅ Gestión de colas Simple Queue en Mikrotik
4. ✅ Gestión de secretos PPPoE en Mikrotik
5. ✅ Monitoreo de CPU/RAM en tiempo real con gráficas
6. ✅ Soporte para múltiples Mikrotik
7. ✅ CRUD de personal, nóminas, contratos
8. ✅ Página de configuración del sistema
9. ✅ Base de datos sincronizada con Mikrotik
10. ✅ Interfaz responsive y funcional