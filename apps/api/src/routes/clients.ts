import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { clientSchema } from '@nexu-core/shared';
import * as mikrotikService from '../services/mikrotik';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { plan: true, mikrotik: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = clientSchema.parse(req.body);
    
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [
          { email: data.email },
          { dni: data.dni },
          { pppoeUser: data.pppoeUser },
        ],
      },
    });
    
    if (existingClient) {
      if (existingClient.email === data.email) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      if (existingClient.dni === data.dni) {
        return res.status(400).json({ error: 'El DNI ya está registrado' });
      }
      if (existingClient.pppoeUser === data.pppoeUser) {
        const maxUserNum = await prisma.client.findFirst({
          where: { pppoeUser: { startsWith: 'user' } },
          orderBy: { pppoeUser: 'desc' },
          select: { pppoeUser: true },
        });
        const nextNum = maxUserNum ? parseInt(maxUserNum.pppoeUser.replace('user', '')) + 1 : 1;
        data.pppoeUser = `user${String(nextNum).padStart(4, '0')}`;
      }
    }
    
    const plan = await prisma.plan.findUnique({ where: { id: data.planId } });
    const targetIp = `10.0.0.${Math.floor(Math.random() * 254) + 2}`;
    const queueName = `QUEUE-${data.name.toLowerCase()}${data.lastName.toLowerCase()}`;
    const profileName = plan?.name || 'default';
    
    let pppoeUser = data.pppoeUser || '';
    let pppoePassword = data.pppoePassword || '';
    
    if (data.connectionType === 'pppoe') {
      if (!pppoeUser) {
        const randomNum = Math.floor(Math.random() * 9000) + 1000;
        pppoeUser = `${data.name.toLowerCase().charAt(0)}${data.lastName.toLowerCase()}${randomNum}`;
      }
      if (!pppoePassword) {
        pppoePassword = Math.random().toString(36).slice(-6) + Math.floor(Math.random() * 1000);
      }
    }

    let mikrotikErrorMsg = '';

    if (data.syncWithMikrotik) {
      const mikrotik = await prisma.mikrotik.findUnique({ where: { id: data.mikrotikId } });
      
      if (mikrotik) {
        try {
          if (data.connectionType === 'pppoe') {
            await mikrotikService.createPPPoESecret(mikrotik, pppoeUser, pppoePassword, profileName);
          }

          if (data.connectionType === 'queue') {
            const maxLimit = `${plan?.uploadSpeed || 1000}M/${plan?.downloadSpeed || 1000}M`;
            await mikrotikService.createQueue(mikrotik, queueName, targetIp, maxLimit, plan?.priority || 8);
          }
        } catch (err: any) {
          mikrotikErrorMsg = err?.message || 'Error al conectar con Mikrotik';
        }
      } else {
        mikrotikErrorMsg = 'Mikrotik no encontrado';
      }
    }

    const client = await prisma.client.create({
      data: {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        idType: data.idType,
        dni: data.dni,
        address: data.address,
        country: data.country,
        department: data.department,
        city: data.city,
        planId: data.planId,
        mikrotikId: data.mikrotikId,
        pppoeUser: pppoeUser,
        pppoePassword: pppoePassword,
        status: data.status,
        contractId: data.contractId,
        connectionType: data.connectionType,
      },
      include: { plan: true, mikrotik: true },
    });

    if (data.connectionType === 'pppoe') {
      await prisma.pPPoESecret.create({
        data: {
          mikrotikId: data.mikrotikId,
          clientId: client.id,
          name: pppoeUser,
          password: pppoePassword,
          profile: profileName,
          remoteAddress: targetIp,
          disabled: false,
        },
      });
    }

    if (data.connectionType === 'queue') {
      await prisma.queue.create({
        data: {
          mikrotikId: data.mikrotikId,
          clientId: client.id,
          name: queueName,
          target: targetIp,
          maxLimit: `${plan?.downloadSpeed || 1000}M`,
          maxUpload: `${plan?.uploadSpeed || 1000}M`,
          priority: plan?.priority || 8,
          disabled: false,
        },
      });
    }

    res.status(201).json({
      ...client,
      warning: mikrotikErrorMsg || undefined
    });
    
    if (data.syncWithMikrotik && !mikrotikErrorMsg) {
      await createNotification(
        'Nuevo cliente creado',
        `Cliente ${client.name} ${client.lastName} creado exitosamente`,
        'success',
        client.id
      );
    }
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

async function createNotification(title: string, message: string, type: string = 'info', clientId?: string) {
  try {
    await prisma.notification.create({
      data: { title, message, type, clientId }
    });
  } catch {}
}

router.get('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { plan: true, mikrotik: true, invoices: true },
    });
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = clientSchema.partial().parse(req.body);
    
    const oldClient = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { mikrotik: true, plan: true },
    });

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { plan: true, mikrotik: true },
    });

    if (oldClient && client.mikrotikId && client.pppoeUser) {
      try {
        const mikrotik = await prisma.mikrotik.findUnique({ where: { id: client.mikrotikId } });
        if (mikrotik) {
          if (oldClient.pppoeUser !== client.pppoeUser) {
            await mikrotikService.deletePPPoESecret(mikrotik, oldClient.pppoeUser);
            await mikrotikService.deleteQueue(mikrotik, `QUEUE-${oldClient.pppoeUser}`);

            const plan = await prisma.plan.findUnique({ where: { id: client.planId } });
            
            await mikrotikService.createPPPoESecret(mikrotik, client.pppoeUser, client.pppoePassword || oldClient.pppoePassword, plan?.name || 'default');
            
            const targetIp = `10.0.0.${Math.floor(Math.random() * 254) + 2}`;
            const maxLimit = `${plan?.uploadSpeed || 1000}M/${plan?.downloadSpeed || 1000}M`;
            await mikrotikService.createQueue(mikrotik, `QUEUE-${client.pppoeUser}`, targetIp, maxLimit, plan?.priority || 8);
          }
        }
      } catch (mikrotikError) {
        console.error('Error al actualizar en Mikrotik:', mikrotikError);
      }
    }

    res.json(client);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { mikrotik: true },
    });

    if (client) {
      await prisma.pPPoESecret.deleteMany({ where: { clientId: req.params.id } });
      await prisma.queue.deleteMany({ where: { clientId: req.params.id } });

      try {
        if (client.mikrotik) {
          await mikrotikService.deletePPPoESecret(client.mikrotik, client.pppoeUser);
          await mikrotikService.deleteQueue(client.mikrotik, `QUEUE-${client.pppoeUser}`);
        }
      } catch (mikrotikError) {
        console.error('Error al eliminar de Mikrotik:', mikrotikError);
      }
    }

    await prisma.client.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;
