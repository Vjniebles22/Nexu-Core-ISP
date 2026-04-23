import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { pppoeSchema } from '@nexu-core/shared';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const secrets = await prisma.pPPoESecret.findMany({
      include: { mikrotik: true, client: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(secrets);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = pppoeSchema.parse(req.body);
    const secret = await prisma.pPPoESecret.create({
      data: {
        mikrotikId: data.mikrotikId,
        clientId: data.clientId,
        name: data.name,
        password: data.password,
        profile: data.profile,
        remoteAddress: data.remoteAddress,
        localAddress: data.localAddress,
        disabled: data.disabled,
      },
      include: { mikrotik: true, client: true },
    });
    res.status(201).json(secret);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const secret = await prisma.pPPoESecret.findUnique({
      where: { id: req.params.id },
      include: { mikrotik: true, client: true },
    });
    if (!secret) {
      return res.status(404).json({ error: 'Secreto PPPoE no encontrado' });
    }
    res.json(secret);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = pppoeSchema.partial().parse(req.body);
    const secret = await prisma.pPPoESecret.update({
      where: { id: req.params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { mikrotik: true, client: true },
    });
    res.json(secret);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.pPPoESecret.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;