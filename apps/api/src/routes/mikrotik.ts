import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { mikrotikSchema, mikrotikUpdateSchema } from '@nexu-core/shared';
import * as mikrotikService from '../services/mikrotik';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const mikrotiks = await prisma.mikrotik.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(mikrotiks);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = mikrotikSchema.parse(req.body);
    
    const createData: any = {
      name: data.name,
      ip: data.ip,
      apiPort: data.apiPort || 8728,
      apiSslPort: data.apiSslPort || 8729,
      username: data.username,
      password: data.password,
      useSsl: data.useSsl !== false,
      status: 'offline',
    };

    const testResult = await mikrotikService.testMikrotikConnection({
      id: '',
      ...createData
    });

    createData.status = testResult.success ? 'online' : 'offline';
    if (testResult.success) createData.lastConnected = new Date();

    const mikrotik = await prisma.mikrotik.create({ data: createData });
    res.status(201).json(mikrotik);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const mikrotik = await prisma.mikrotik.findUnique({
      where: { id: req.params.id },
    });
    if (!mikrotik) {
      return res.status(404).json({ error: 'Mikrotik no encontrado' });
    }
    res.json(mikrotik);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = mikrotikUpdateSchema.parse(req.body);
    
    const updateData: any = { updatedAt: new Date() };
    if (data.name) updateData.name = data.name;
    if (data.ip) updateData.ip = data.ip;
    if (data.apiPort) updateData.apiPort = data.apiPort;
    if (data.apiSslPort) updateData.apiSslPort = data.apiSslPort;
    if (data.username) updateData.username = data.username;
    if (data.password && data.password.length > 0) updateData.password = data.password;
    if (data.useSsl !== undefined) updateData.useSsl = data.useSsl;
    
    const mikrotik = await prisma.mikrotik.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(mikrotik);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.mikrotik.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/:id/test', async (req, res) => {
  try {
    const mikrotik = await prisma.mikrotik.findUnique({
      where: { id: req.params.id },
    });
    if (!mikrotik) {
      return res.status(404).json({ error: 'Mikrotik no encontrado' });
    }

    const testResult = await mikrotikService.testMikrotikConnection(mikrotik);

    await prisma.mikrotik.update({
      where: { id: req.params.id },
      data: {
        status: testResult.success ? 'online' : 'offline',
        lastConnected: testResult.success ? new Date() : null,
      },
    });

    res.json({
      success: testResult.success,
      status: testResult.success ? 'online' : 'offline',
      message: testResult.message
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
