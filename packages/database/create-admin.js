const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.create({
      data: {
        email: 'admin@nexu-core.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'admin',
      },
    });
    console.log('Usuario creado:', user.email);
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();