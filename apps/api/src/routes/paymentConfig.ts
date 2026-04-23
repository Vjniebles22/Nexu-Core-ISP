import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const configs = await prisma.paymentConfig.findMany({
      orderBy: { gateway: 'asc' },
    });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      gateway,
      enabled,
      clientId,
      clientSecret,
      publicKey,
      accessToken,
      merchantId,
      accountId,
      country,
      currency,
      testMode,
      webhookUrl,
    } = req.body;

    if (!gateway) {
      return res.status(400).json({ error: 'Se requiere el gateway de pago' });
    }

    const existing = await prisma.paymentConfig.findFirst({
      where: { gateway },
    });

    if (existing) {
      const config = await prisma.paymentConfig.update({
        where: { id: existing.id },
        data: {
          enabled,
          clientId,
          clientSecret,
          publicKey,
          accessToken,
          merchantId,
          accountId,
          country: country || 'CO',
          currency: currency || 'COP',
          testMode: testMode ?? true,
          webhookUrl,
        },
      });
      return res.json(config);
    }

    const config = await prisma.paymentConfig.create({
      data: {
        gateway,
        enabled: enabled ?? false,
        clientId,
        clientSecret,
        publicKey,
        accessToken,
        merchantId,
        accountId,
        country: country || 'CO',
        currency: currency || 'COP',
        testMode: testMode ?? true,
        webhookUrl,
      },
    });

    res.json(config);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.paymentConfig.delete({
      where: { id: req.params.id },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

export default router;