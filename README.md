# Nexu-Core - Sistema de Administración ISP

Sistema integral de administración para proveedores de Internet (ISP) basado en Mikrotik RouterOS.

## Características

### Gestión de Mikrotik
- Conexión y monitoreo de múltiples routers
- Gráficas en tiempo real de CPU, RAM, HDD, Temperatura
- Estadísticas de tráfico TX/RX en vivo
- Historial de métricas

### Gestión de Clientes
- CRUD completo de clientes
- Asignación de planes y Mikrotik
- Autenticación PPPoE
- Estados: activo, suspendido, inactivo

### Facturación
- Generación automática de facturas mensuales
- Estados: pendiente, pagado, vencido
- Historial de pagos
- Múltiples pasarelas de pago

### Pasarelas de Pago
- **Stripe** - Pagos con tarjeta
- **Mercado Pago** - Pagos en Latinoamérica
- **Wompi** - Pagos en Colombia
- **PlacetoPay** - Pagos en Colombia
- **PayU** - Pagos multilatino

### Portal del Cliente
- Consulta de facturas por DNI/Email
- Pagos en línea con múltiples métodos
- Historial de pagos

### Dashboard
- Resumen de clientes, Mikrotiks, facturas
- Monitoreo en tiempo real
- Gráficas de tráfico de red
- Historial reciente de actividad
- Facturas vencidas

## Tecnología

- **Backend**: Node.js + Express + Prisma + SQLite
- **Frontend**: Next.js 14 + Tailwind CSS + Recharts
- **UI**: Lucide React Icons + Radix UI
- **Monitoreo**: node-routeros (API Mikrotik)
- **Tiempo Real**: Actualizaciones cada 5 segundos

## Estructura del Proyecto

```
nexu-core/
├── apps/
│   ├── api/          # Backend Express
│   │   └── src/
│   │       ├── routes/     # Rutas API
│   │       ├── services/   # Lógica de negocio
│   │       └── lib/        # Utilidades
│   └── web/          # Frontend Next.js
│       └── src/
│           ├── app/        # Páginas
│           ├── components/ # Componentes
│           └── lib/       # Utilidades
├── packages/
│   ├── database/     # Prisma schema
│   └── shared/       # Tipos y validaciones
├── .env.example     # Variables de entorno
└── README.md
```

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Vjniebles22/Nexu-Core-ISP.git
cd nexu-core
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Configurar base de datos
```bash
cd packages/database
npx prisma generate
npx prisma db push
```

### 5. Poblar datos de prueba (opcional)
```bash
cd packages/database
npx prisma db seed
```

## Variables de Entorno

### API (.env)
```env
# Base de datos
DATABASE_URL="file:./dev.db"

# Puerto
PORT=3001

# Stripe (opcional)
STRIPE_SECRET_KEY=sk_test_...

# Mercado Pago (opcional)
MERCADOPAGO_ACCESS_TOKEN=...

# Wompi (opcional)
WOMPI_PRIVATE_KEY=...
WOMPI_EVENT_SECRET=...
WOMPI_PRESENCE_ID=...

# PlacetoPay (opcional)
PLACETOPAY_LOGIN=...
PLACETOPAY_TRANKEY=...
PLACETOPAY_URL=https://test.placetopay.com

# PayU (opcional)
PAYU_MERCHANT_ID=...
PAYU_ACCOUNT_ID=...
PAYU_API_KEY=...
PAYU_URL=https://sandbox.gateway.payulatam.com
```

### Web (.env.local)
```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Ejecución

### Desarrollo

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

### Producción

```bash
# Build
npm run build

# Iniciar API
cd apps/api
npm run build
npm start

# Iniciar Web
cd apps/web
npm run build
npm start
```

## Puertos

| Servicio | URL |
|----------|-----|
| API | http://localhost:3001 |
| Web | http://localhost:3000 |

## API Endpoints

### Mikrotik
- `GET /api/mikrotik` - Listar todos
- `POST /api/mikrotik` - Crear
- `GET /api/mikrotik/:id` - Obtener uno
- `PUT /api/mikrotik/:id` - Actualizar
- `DELETE /api/mikrotik/:id` - Eliminar
- `POST /api/mikrotik/:id/test` - Probar conexión
- `GET /api/monitoring/:id` - Estadísticas en tiempo real
- `GET /api/monitoring/:id/history` - Historial de métricas

### Clientes
- `GET /api/clients` - Listar todos
- `POST /api/clients` - Crear
- `GET /api/clients/:id` - Obtener uno
- `PUT /api/clients/:id` - Actualizar
- `DELETE /api/clients/:id` - Eliminar

### Planes
- `GET /api/plans` - Listar todos
- `POST /api/plans` - Crear
- `PUT /api/plans/:id` - Actualizar
- `DELETE /api/plans/:id` - Eliminar

### Facturas
- `GET /api/invoices` - Listar (con paginación)
- `POST /api/invoices` - Crear/generar
- `GET /api/invoices/:id` - Obtener uno
- `PUT /api/invoices/:id` - Actualizar
- `PUT /api/invoices/:id/pay` - Marcar como pagada
- `GET /api/invoices/search` - Buscar por cliente

### Portal (Cliente)
- `GET /api/portal/invoices` - Buscar facturas
- `POST /api/portal/payment/init` - Iniciar pago
- `GET /api/portal/payment/config` - Config de pasarelas
- `POST /api/portal/webhook/:gateway` - Webhooks de pago

### Pagos
- `GET /api/payments` - Listar pagos
- `POST /api/payments` - Registrar pago manual

### Configuración
- `GET /api/payment-config` - Obtener config de pagos
- `POST /api/payment-config` - Crear/actualizar config

## Monitoreo

El sistema monitorea los Mikrotiks cada 5 segundos:
- CPU usage (%)
- RAM usage (%)
- HDD usage (%)
- Temperatura (°C)
- Uptime
- Tráfico TX/RX (bytes)
- Versión RouterOS

Los datos se almacenan en `NetworkStatistic` para gráficos históricos.

## Seguridad

- CORS configurado para desarrollo local
- Helmet.js para headers de seguridad
- Validación de datos con Zod
- Credenciales de Mikrotik encriptadas (recomendado)

## Licencia

MIT
