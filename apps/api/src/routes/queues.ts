import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { queueSchema } from '@nexu-core/shared';
import * as mikrotikService from '../services/mikrotik';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const queues = await prisma.queue.findMany({
      include: { mikrotik: true, client: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(queues);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = queueSchema.parse(req.body);
    const queue = await prisma.queue.create({
      data: {
        mikrotikId: data.mikrotikId,
        clientId: data.clientId,
        name: data.name,
        target: data.target,
        maxLimit: data.maxLimit,
        maxUpload: data.maxUpload,
        priority: data.priority,
        burstLimit: data.burstLimit,
        burstThreshold: data.burstThreshold,
        burstTime: data.burstTime,
        limitAt: data.limitAt,
        disabled: data.disabled,
      },
      include: { mikrotik: true, client: true },
    });
    res.status(201).json(queue);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const queue = await prisma.queue.findUnique({
      where: { id: req.params.id },
      include: { mikrotik: true, client: true },
    });
    if (!queue) {
      return res.status(404).json({ error: 'Cola no encontrada' });
    }
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = queueSchema.partial().parse(req.body);
    const queue = await prisma.queue.update({
      where: { id: req.params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { mikrotik: true, client: true },
    });
    res.json(queue);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.queue.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/sync', async (req, res) => {
  try {
    const { mikrotikId } = req.body;
    if (!mikrotikId) {
      return res.status(400).json({ error: 'Se requiere mikrotikId' });
    }

    const mikrotik = await prisma.mikrotik.findUnique({ where: { id: mikrotikId } });
    if (!mikrotik) {
      return res.status(400).json({ error: 'Mikrotik no encontrado' });
    }

    let mkQueues: any[] = [];
    try {
      mkQueues = await mikrotikService.getMikrotikQueues(mikrotik);
    } catch {
      return res.json({ 
        success: false, 
        warning: true,
        message: 'Mikrotik no disponible. Verifica la conexión.' 
      });
    }

    const localQueues = await prisma.queue.findMany({
      where: { mikrotikId },
      include: { client: true },
    });

    let created = 0;
    let updated = 0;

    for (const mkQueue of mkQueues) {
      if (!mkQueue.name || mkQueue.name.startsWith('global') || mkQueue.name.startsWith('<')) continue;
      
      const existingQueue = localQueues.find(q => q.name === mkQueue.name);
      const maxLimit = mkQueue['max-limit'] || '';
      const maxUpload = maxLimit.split('/')[0] || '';
      const maxDownload = maxLimit.split('/')[1] || '';

      if (existingQueue) {
        await prisma.queue.update({
          where: { id: existingQueue.id },
          data: {
            maxLimit: maxDownload,
            maxUpload: maxUpload,
            disabled: mkQueue.disabled === 'true' || mkQueue.disabled === true,
            updatedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.queue.create({
          data: {
            mikrotikId,
            name: mkQueue.name,
            target: mkQueue.target || '',
            maxLimit: maxDownload,
            maxUpload: maxUpload,
            priority: parseInt(mkQueue.priority) || 8,
            disabled: mkQueue.disabled === 'true' || mkQueue.disabled === true,
          },
        });
        created++;
      }
    }

    await prisma.mikrotik.update({
      where: { id: mikrotikId },
      data: { status: 'online', lastConnected: new Date() },
    });

    res.json({ 
      success: true, 
      message: `${created} colas creadas, ${updated} actualizadas`,
      syncd: created + updated
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;