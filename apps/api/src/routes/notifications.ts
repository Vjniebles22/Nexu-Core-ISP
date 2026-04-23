import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.get('/unread-count', async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { read: false },
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, message, type, userId, clientId, invoiceId } = req.body;
    
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type || 'info',
        userId,
        clientId,
        invoiceId,
      },
    });
    
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;