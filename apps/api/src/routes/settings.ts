import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

const DEFAULT_SETTINGS = [
  { key: 'company_name', value: 'Nexu-Core ISP', category: 'general' },
  { key: 'company_ruc', value: '', category: 'general' },
  { key: 'company_address', value: '', category: 'general' },
  { key: 'company_phone', value: '', category: 'general' },
  { key: 'company_email', value: '', category: 'general' },
  { key: 'invoice_due_days', value: '15', category: 'billing' },
  { key: 'invoice_currency', value: 'USD', category: 'billing' },
  { key: 'invoice_prefix', value: 'INV', category: 'billing' },
  { key: 'auto_generate_invoices', value: 'true', category: 'billing' },
  { key: 'smtp_host', value: '', category: 'notifications' },
  { key: 'smtp_port', value: '587', category: 'notifications' },
  { key: 'smtp_user', value: '', category: 'notifications' },
  { key: 'smtp_password', value: '', category: 'notifications' },
];

router.get('/', async (req, res) => {
  try {
    let settings = await prisma.systemSetting.findMany({
      orderBy: { category: 'asc' },
    });

    if (settings.length === 0) {
      await prisma.systemSetting.createMany({
        data: DEFAULT_SETTINGS,
      });
      settings = await prisma.systemSetting.findMany();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/', async (req, res) => {
  try {
    const { key, value, category } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Se requieren key y value' });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, category: category || 'general', updatedAt: new Date() },
      create: { key, value, category: category || 'general' },
    });

    res.json(setting);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: req.params.key },
    });
    if (!setting) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;