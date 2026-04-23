import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const firstNames = ['Juan', 'Maria', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Luis', 'Sofia', 'Miguel', 'Isabella', 'Diego', 'Carmen', 'Javier', 'Andrea', 'Fernando', 'Gabriela', 'Roberto', 'Patricia', 'Ricardo', 'Monica', 'Eduardo', 'Sandra', 'Manuel', 'Liliana', 'Francisco', 'Teresa', 'Alejandro', 'Jennifer', 'Andres', 'Lorena', 'Sergio', 'Ana', 'Gustavo', 'Miriam', 'Daniel', 'Carolina', 'Oscar', 'Diana', 'Raul', 'Elena', 'Victor', 'Rosa', 'Hugo', 'Silvia', 'Alfonso', 'Beatriz', 'Ignacio', 'Veronica', 'Emilio', 'Gloria', 'Marco', 'Susana', 'Oscar', 'Natalia', 'Adrian', 'Claudia', 'Ivan', 'Esperanza', 'Ramiro', 'Dolores', 'Ernesto', 'Catalina', 'Fabián', 'Ines', 'Gonzalo', 'Adriana'];

const lastNames = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Cruz', 'Reyes', 'Morales', 'Ortiz', 'Gutierrez', 'Ramos', 'Vargas', 'Castillo', 'Jimenez', 'Romero', 'Herrera', 'Medina', 'Aguirre', 'Moreno', 'Mendez', 'Vega', 'Luna', 'Nunez', 'Palacios', 'Espinoza', 'Maldonado', 'Contreras', 'Guerrero', 'Valencia', 'Rosas', 'Avalos', 'Orozco', 'Escobar', 'Navarro', 'Castaneda', 'Campos', 'Molina', 'Zuniga', 'Peralta', 'Salazar', 'Aguilar', 'Cisneros', 'Salinas', 'Zambrano', 'Bonilla', 'Cortez'];

const cities = {
  CO: ['Bogota D.C.', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Cundinamarca', 'Antioquia', 'Valle del Cauca'],
  AR: ['Buenos Aires', 'Cordoba', 'Santa Fe', 'Mendoza', 'Tucuman', 'Entre Rios'],
  CL: ['Santiago', 'Valparaiso', 'Concepcion', 'La Serena'],
  PE: ['Lima', 'Arequipa', 'Trujillo', 'Chiclayo'],
  MX: ['Ciudad de Mexico', 'Guadalajara', 'Monterrey', 'Puebla'],
  BR: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia'],
  EC: ['Quito', 'Guayaquil'],
  PA: ['Panama', 'Colon'],
  CR: ['San Jose', 'Alajuela'],
  UY: ['Montevideo', 'Canelones'],
};

const streets = ['Calle', 'Carrera', 'Avenida', 'Transversal', 'Diagonal'];
const streetNumbers = Array.from({ length: 100 }, (_, i) => i + 1);

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDni(country: string): string {
  const length = country === 'CO' ? 10 : country === 'AR' ? 8 : country === 'CL' ? 9 : 11;
  let dni = '';
  for (let i = 0; i < length; i++) {
    dni += Math.floor(Math.random() * 10);
  }
  return dni;
}

const idTypes = ['CC', 'DNI', 'CE', 'RUT', 'CI', 'CPP', 'CPF', 'NIT'];

const countries = ['CO', 'AR', 'CL', 'PE', 'MX', 'BR', 'EC', 'PA', 'CR', 'UY'];

async function main() {
  console.log('Iniciando seed...');
  console.log('Limpiando datos existentes...');
  await prisma.invoice.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.pPPoESecret.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.networkStatistic.deleteMany();
  await prisma.client.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.mikrotik.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@nexu-core.com' },
  });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        email: 'admin@nexu-core.com',
        password: 'admin123',
        name: 'Administrador',
        role: 'admin',
      },
    });
    console.log('Usuario admin creado');
  }

  // Create plans
  const plansData = [
    { name: 'Basico 10MB', downloadSpeed: 10, uploadSpeed: 5, dataLimit: 100, price: 50000, priority: 8 },
    { name: 'Basico 20MB', downloadSpeed: 20, uploadSpeed: 10, dataLimit: 150, price: 70000, priority: 8 },
    { name: 'Standard 50MB', downloadSpeed: 50, uploadSpeed: 25, dataLimit: 300, price: 95000, priority: 6 },
    { name: 'Premium 100MB', downloadSpeed: 100, uploadSpeed: 50, dataLimit: 500, price: 120000, priority: 4 },
    { name: 'Premium 200MB', downloadSpeed: 200, uploadSpeed: 100, dataLimit: 800, price: 150000, priority: 3 },
    { name: 'Empresarial 50MB', downloadSpeed: 50, uploadSpeed: 50, dataLimit: 500, price: 180000, priority: 2 },
    { name: 'Empresarial 100MB', downloadSpeed: 100, uploadSpeed: 100, dataLimit: 1000, price: 250000, priority: 1 },
    { name: 'Empresarial 200MB', downloadSpeed: 200, uploadSpeed: 200, dataLimit: 2000, price: 350000, priority: 1 },
  ];

  const createdPlans = await Promise.all(
    plansData.map(plan => prisma.plan.create({ data: plan }))
  );
  console.log(`${createdPlans.length} planes creados`);

  // Create Mikrotiks
  const mikrotiksData = [
    { name: 'MK-BOG-01', ip: '192.168.1.1', username: 'admin', password: 'admin123', useSsl: true, status: 'online' },
    { name: 'MK-MED-01', ip: '192.168.2.1', username: 'admin', password: 'admin123', useSsl: true, status: 'online' },
    { name: 'MK-CAL-01', ip: '192.168.3.1', username: 'admin', password: 'admin123', useSsl: true, status: 'offline' },
  ];

  const createdMikrotiks = await Promise.all(
    mikrotiksData.map(mk => prisma.mikrotik.create({ data: mk }))
  );
  console.log(`${createdMikrotiks.length} Mikrotiks creados`);

  // Create employees
  const employeesData = [
    { name: 'Carlos', lastName: 'Rodriguez', email: 'carlos.rodriguez@nexu.com', dni: '12345678', role: 'admin', phone: '3001234567', salary: 2500000, hireDate: new Date('2023-01-15') },
    { name: 'Maria', lastName: 'Gonzalez', email: 'maria.gonzalez@nexu.com', dni: '23456789', role: 'technician', phone: '3002345678', salary: 1500000, hireDate: new Date('2023-03-20') },
    { name: 'Juan', lastName: 'Martinez', email: 'juan.martinez@nexu.com', dni: '34567890', role: 'technician', phone: '3003456789', salary: 1500000, hireDate: new Date('2023-05-10') },
    { name: 'Ana', lastName: 'Lopez', email: 'ana.lopez@nexu.com', dni: '45678901', role: 'support', phone: '3004567890', salary: 1200000, hireDate: new Date('2023-06-01') },
    { name: 'Pedro', lastName: 'Sanchez', email: 'pedro.sanchez@nexu.com', dni: '56789012', role: 'sales', phone: '3005678901', salary: 1100000, hireDate: new Date('2023-07-15') },
    { name: 'Laura', lastName: 'Ramirez', email: 'laura.ramirez@nexu.com', dni: '67890123', role: 'accounting', phone: '3006789012', salary: 1300000, hireDate: new Date('2023-08-01') },
    { name: 'Luis', lastName: 'Torres', email: 'luis.torres@nexu.com', dni: '78901234', role: 'technician', phone: '3007890123', salary: 1600000, hireDate: new Date('2023-09-10') },
    { name: 'Sofia', lastName: 'Flores', email: 'sofia.flores@nexu.com', dni: '89012345', role: 'support', phone: '3008901234', salary: 1200000, hireDate: new Date('2023-10-05') },
    { name: 'Diego', lastName: 'Rivera', email: 'diego.rivera@nexu.com', dni: '90123456', role: 'sales', phone: '3009012345', salary: 1150000, hireDate: new Date('2023-11-01') },
    { name: 'Carmen', lastName: 'Gomez', email: 'carmen.gomez@nexu.com', dni: '01234567', role: 'admin', phone: '3000123456', salary: 2000000, hireDate: new Date('2024-01-10') },
  ];

  const createdEmployees = await Promise.all(
    employeesData.map(emp => prisma.employee.create({ data: emp }))
  );
  console.log(`${createdEmployees.length} empleados creados`);

  // Create 150 clients
  const clientsCreated = [];
  for (let i = 0; i < 150; i++) {
    const country = randomElement(countries);
    const countryCities = cities[country as keyof typeof cities] || cities.CO;
    const plan = randomElement(createdPlans);
    const mikrotik = randomElement(createdMikrotiks);
    
    const name = randomElement(firstNames);
    const lastName = randomElement(lastNames);
    const street = randomElement(streets);
    const num = randomElement(streetNumbers);
    
    const client = await prisma.client.create({
      data: {
        name,
        lastName,
        email: `${name.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        phone: `3${randomInt(10, 99)}${randomInt(1000000, 9999999)}`,
        idType: randomElement(idTypes),
        dni: generateDni(country),
        address: `${street} ${num} #${randomInt(1, 50)}-${randomInt(1, 99)}`,
        country,
        department: randomElement(countryCities),
        city: randomElement(countryCities),
        planId: plan.id,
        mikrotikId: mikrotik.id,
        pppoeUser: `user${String(i + 1).padStart(4, '0')}`,
        pppoePassword: `pass${randomInt(1000, 9999)}`,
        status: i < 130 ? 'active' : i < 145 ? 'suspended' : 'cancelled',
      },
    });
    clientsCreated.push(client);
  }
  console.log(`${clientsCreated.length} clientes creados`);

  // Create invoices for clients
  const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const years = [2024, 2025];
  
  const invoicesCreated = [];
  for (const client of clientsCreated) {
    const clientInvoices = Math.floor(Math.random() * 6) + 1;
    
    for (let m = 0; m < clientInvoices; m++) {
      const year = randomElement(years);
      const month = randomElement(months);
      const plan = await prisma.plan.findUnique({ where: { id: client.planId } });
      
      const dueDate = new Date(year, month, randomInt(5, 25));
      const isPaid = Math.random() > 0.3;
      
      const invoice = await prisma.invoice.create({
        data: {
          clientId: client.id,
          amount: plan?.price || 50000,
          status: isPaid ? 'paid' : Math.random() > 0.5 ? 'pending' : 'overdue',
          dueDate: dueDate,
          paidDate: isPaid ? new Date(dueDate.getTime() + randomInt(1, 15) * 24 * 60 * 60 * 1000) : null,
          period: `${month + 1}-${year}`,
          description: `Servicio de internet ${plan?.name || 'Basico'}`,
        },
      });
      invoicesCreated.push(invoice);
    }
  }
  console.log(`${invoicesCreated.length} facturas creadas`);

  // Create contracts for some clients
  for (let i = 0; i < Math.min(50, clientsCreated.length); i++) {
    const client = clientsCreated[i];
    const existingContract = await prisma.contract.findUnique({
      where: { clientId: client.id },
    });
    
    if (!existingContract) {
      await prisma.contract.create({
        data: {
          clientId: client.id,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-12-31'),
          terms: 'Contrato de servicios de internet por 2 anos',
          status: 'active',
        },
      });
    }
  }
  console.log('Contratos creados');

  // Create system settings
  const settingsData = [
    { key: 'company_name', value: 'NexuCore ISP', category: 'general' },
    { key: 'company_phone', value: '+57 300 123 4567', category: 'general' },
    { key: 'company_email', value: 'soporte@nexu-core.com', category: 'general' },
    { key: 'invoice_days_due', value: '30', category: 'billing' },
    { key: 'invoice_late_fee', value: '5', category: 'billing' },
  ];

  for (const setting of settingsData) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('Configuraciones del sistema creadas');

  console.log('\n=== Seed completado ===');
  console.log(`- Admin: admin@nexu-core.com / admin123`);
  console.log(`- ${createdPlans.length} planes`);
  console.log(`- ${createdMikrotiks.length} Mikrotiks`);
  console.log(`- ${createdEmployees.length} empleados`);
  console.log(`- ${clientsCreated.length} clientes`);
  console.log(`- ${invoicesCreated.length} facturas`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());