import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { invoiceSchema } from '@nexu-core/shared';

const router = Router();

async function createNotification(title: string, message: string, type: string = 'info', invoiceId?: string) {
  try {
    await prisma.notification.create({
      data: { title, message, type, invoiceId }
    });
  } catch {}
}

router.get('/', async (req, res) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }

    if (search) {
      where.client = {
        OR: [
          { dni: { contains: search as string } },
          { name: { contains: search as string } },
          { lastName: { contains: search as string } },
        ]
      };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { client: { include: { plan: true } } },
      orderBy: { dueDate: 'desc' },
      take: limitNum,
      skip,
    });

    const total = await prisma.invoice.count({ where });

    res.json({
      data: invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = invoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.create({
      data: {
        clientId: data.clientId,
        amount: data.amount,
        status: data.status,
        dueDate: data.dueDate,
        paidDate: data.paidDate,
        period: data.period,
        description: data.description,
      },
      include: { client: { include: { plan: true } } },
    });
    res.status(201).json(invoice);
    
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    await createNotification(
      'Nueva factura',
      `Factura ${invoice.period} creada para ${client?.name} ${client?.lastName}`,
      'info',
      invoice.id
    );
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { client: { include: { plan: true } } },
    });
    if (!invoice) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = invoiceSchema.partial().parse(req.body);
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { client: { include: { plan: true } } },
    });
    res.json(invoice);
    
    if (data.status === 'paid') {
      await createNotification(
        'Factura pagada',
        `Factura ${invoice.period} de ${invoice.client.name} ${invoice.client.lastName} ha sido pagada`,
        'success',
        invoice.id
      );
    }
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.invoice.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { period } = req.body;
    const currentPeriod = period || new Date().toISOString().slice(0, 7);

    const clients = await prisma.client.findMany({
      where: { status: 'active' },
      include: { plan: true },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoices = await Promise.all(
      clients.map(async (client) => {
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            clientId: client.id,
            period: currentPeriod,
          },
        });

        if (existingInvoice) {
          return existingInvoice;
        }

        return prisma.invoice.create({
          data: {
            clientId: client.id,
            amount: client.plan.price,
            status: 'pending',
            dueDate,
            period: currentPeriod,
            description: `Factura del período ${currentPeriod} - Plan ${client.plan.name}`,
          },
        });
      })
    );

    res.json({
      success: true,
      message: `${invoices.length} facturas generadas`,
      period: currentPeriod,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;