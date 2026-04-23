import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { payrollSchema } from '@nexu-core/shared';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const payrolls = await prisma.payroll.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(payrolls);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = payrollSchema.parse(req.body);
    
    const total = data.baseSalary + data.bonuses - data.deductions;
    
    const payroll = await prisma.payroll.create({
      data: {
        employeeId: data.employeeId,
        period: data.period,
        baseSalary: data.baseSalary,
        bonuses: data.bonuses,
        deductions: data.deductions,
        total,
      },
      include: { employee: true },
    });
    res.status(201).json(payroll);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: req.params.id },
      include: { employee: true },
    });
    if (!payroll) {
      return res.status(404).json({ error: 'Nómina no encontrada' });
    }
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = payrollSchema.partial().parse(req.body);
    
    const total = (data.baseSalary ?? 0) + (data.bonuses ?? 0) - (data.deductions ?? 0);
    
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: {
        ...data,
        total,
        updatedAt: new Date(),
      },
      include: { employee: true },
    });
    res.json(payroll);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.payroll.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/calculate', async (req, res) => {
  try {
    const { employeeId, period, bonuses = 0, deductions = 0 } = req.body;

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const total = employee.salary + bonuses - deductions;

    res.json({
      employeeId,
      period,
      baseSalary: employee.salary,
      bonuses,
      deductions,
      total: total,
      employeeName: `${employee.name} ${employee.lastName}`,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;