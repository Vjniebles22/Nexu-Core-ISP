import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { contractSchema } from '@nexu-core/shared';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const contracts = await prisma.contract.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = contractSchema.parse(req.body);
    const contract = await prisma.contract.create({
      data: {
        clientId: data.clientId,
        startDate: data.startDate,
        endDate: data.endDate,
        terms: data.terms,
        status: data.status,
      },
    });
    res.status(201).json(contract);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.id },
    });
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = contractSchema.partial().parse(req.body);
    const contract = await prisma.contract.update({
      where: { id: req.params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    res.json(contract);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.contract.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;