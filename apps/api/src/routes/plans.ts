import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { planSchema } from '@nexu-core/shared';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = planSchema.parse(req.body);
    const plan = await prisma.plan.create({
      data: {
        name: data.name,
        downloadSpeed: data.downloadSpeed,
        uploadSpeed: data.uploadSpeed,
        dataLimit: data.dataLimit,
        price: data.price,
        priority: data.priority,
        queueType: data.queueType,
        burstLimit: data.burstLimit,
        burstThreshold: data.burstThreshold,
        minLimit: data.minLimit,
      },
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: req.params.id },
    });
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = planSchema.partial().parse(req.body);
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    res.json(plan);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.plan.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;