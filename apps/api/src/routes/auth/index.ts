import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || user.password !== data.password) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    res.status(400).json({ error: 'Datos inválidos' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const data = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    console.log(`🔗 Token de recuperación para ${user.email}: ${resetToken}`);

    res.json({ message: 'Enlace de recuperación enviado' });
  } catch (error) {
    res.status(400).json({ error: 'Datos inválidos' });
  }
});

export default router;