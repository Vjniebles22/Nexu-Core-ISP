import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import mikrotikRoutes from './routes/mikrotik';

const prisma = new PrismaClient();
import clientRoutes from './routes/clients';
import planRoutes from './routes/plans';
import queueRoutes from './routes/queues';
import pppoeRoutes from './routes/pppoe';
import invoiceRoutes from './routes/invoices';
import employeeRoutes from './routes/employees';
import payrollRoutes from './routes/payrolls';
import contractRoutes from './routes/contracts';
import settingsRoutes from './routes/settings';
import monitoringRoutes from './routes/monitoring';
import authRoutes from './routes/auth';
import notificationRoutes from './routes/notifications';
import portalRoutes from './routes/portal';
import paymentConfigRoutes from './routes/paymentConfig';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/mikrotik', mikrotikRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/pppoe', pppoeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payrolls', payrollRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/payment-config', paymentConfigRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: String(error) });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('subscribe', (mikrotikId: string) => {
    socket.join(`mikrotik:${mikrotikId}`);
  });

  socket.on('unsubscribe', (mikrotikId: string) => {
    socket.leave(`mikrotik:${mikrotikId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export { io };

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Nexu-Core API running on port ${PORT}`);
});

export default app;