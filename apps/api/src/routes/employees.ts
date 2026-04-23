import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { employeeSchema } from '@nexu-core/shared';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = employeeSchema.parse(req.body);
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        dni: data.dni,
        role: data.role,
        phone: data.phone,
        salary: data.salary,
        hireDate: data.hireDate,
        status: data.status,
      },
    });
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: { payrolls: true },
    });
    if (!employee) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = employeeSchema.partial().parse(req.body);
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.employee.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

export default router;