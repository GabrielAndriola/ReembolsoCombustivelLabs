import 'dotenv/config';
import { PrismaClient, PresenceStatus, UserRole } from '@prisma/client';
import { hashPassword } from '../utils/password';

const prisma = new PrismaClient();

const buildAddress = (data: {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}) => ({
  ...data,
  country: 'Brasil',
  formattedAddress: `${data.street}, ${data.number} - ${data.district}, ${data.city}/${data.state}`
});

async function main() {
  await prisma.presenceRecord.deleteMany();
  await prisma.monthlyRate.deleteMany();
  await prisma.employeeAddress.deleteMany();
  await prisma.companyAddress.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.address.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: 'TechCorp Brasil',
      active: true
    }
  });

  const companyAddress = await prisma.address.create({
    data: buildAddress({
      zipCode: '01310-100',
      street: 'Avenida Paulista',
      number: '1578',
      complement: '5º andar',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.5613991,
      longitude: -46.6565712
    })
  });

  await prisma.companyAddress.create({
    data: {
      companyId: company.id,
      addressId: companyAddress.id,
      isMain: true
    }
  });

  const passwordHash = await hashPassword('12345678');

  const admin = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Admin KM',
      email: 'admin@crisdu.com.br',
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  const supervisor = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Carlos Silva',
      email: 'supervisor@crisdu.com.br',
      passwordHash,
      role: UserRole.SUPERVISOR,
      employeeProfile: {
        create: {
          employeeCode: 'SUP001',
          department: 'Gestão'
        }
      }
    }
  });

  const employees = [
    {
      name: 'Maria Santos',
      email: 'maria.santos@crisdu.com.br',
      employeeCode: 'EMP042',
      department: 'Comercial',
      reimbursementPerKm: 0.85,
      distanceToCompanyKm: 12,
      distanceFromCompanyKm: 12,
      address: buildAddress({
        zipCode: '04101-300',
        street: 'Rua das Flores',
        number: '123',
        district: 'Vila Mariana',
        city: 'São Paulo',
        state: 'SP',
        latitude: -23.5893917,
        longitude: -46.6340278
      }),
      dates: ['2026-03-03', '2026-03-04', '2026-03-06']
    },
    {
      name: 'João Oliveira',
      email: 'joao.oliveira@crisdu.com.br',
      employeeCode: 'EMP087',
      department: 'TI',
      reimbursementPerKm: 0.92,
      distanceToCompanyKm: 9,
      distanceFromCompanyKm: 9,
      address: buildAddress({
        zipCode: '05432-000',
        street: 'Rua Augusta',
        number: '456',
        district: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        latitude: -23.5557714,
        longitude: -46.6629868
      }),
      dates: ['2026-03-02', '2026-03-05']
    },
    {
      name: 'Ana Paula Costa',
      email: 'ana.costa@crisdu.com.br',
      employeeCode: 'EMP015',
      department: 'RH',
      reimbursementPerKm: 0.88,
      distanceToCompanyKm: 16,
      distanceFromCompanyKm: 16,
      address: buildAddress({
        zipCode: '01046-010',
        street: 'Avenida Ipiranga',
        number: '789',
        district: 'República',
        city: 'São Paulo',
        state: 'SP',
        latitude: -23.5440506,
        longitude: -46.6452361
      }),
      dates: ['2026-03-03', '2026-03-04', '2026-03-07']
    }
  ];

  for (const employeeData of employees) {
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        name: employeeData.name,
        email: employeeData.email,
        passwordHash,
        role: UserRole.EMPLOYEE,
        employeeProfile: {
          create: {
            employeeCode: employeeData.employeeCode,
            department: employeeData.department,
            supervisorId: supervisor.id,
            distanceToCompanyKm: employeeData.distanceToCompanyKm,
            distanceFromCompanyKm: employeeData.distanceFromCompanyKm
          }
        }
      }
    });

    const address = await prisma.address.create({
      data: employeeData.address
    });

    await prisma.employeeAddress.create({
      data: {
        employeeUserId: user.id,
        addressId: address.id,
        isMain: true
      }
    });

    await prisma.monthlyRate.create({
      data: {
        employeeUserId: user.id,
        year: 2026,
        month: 3,
        reimbursementPerKm: employeeData.reimbursementPerKm
      }
    });

    const oneWayDistance = employeeData.distanceToCompanyKm;
    const roundTripDistance = Number((employeeData.distanceToCompanyKm + employeeData.distanceFromCompanyKm).toFixed(2));

    for (const date of employeeData.dates) {
      await prisma.presenceRecord.create({
        data: {
          employeeUserId: user.id,
          presenceDate: new Date(`${date}T00:00:00.000Z`),
          observation: 'Registro inicial do seed',
          distanceOneWayKm: oneWayDistance,
          distanceRoundTripKm: roundTripDistance,
          reimbursementPerKmApplied: employeeData.reimbursementPerKm,
          reimbursementAmount: Number((roundTripDistance * employeeData.reimbursementPerKm).toFixed(2)),
          status: date.endsWith('06') || date.endsWith('07') ? PresenceStatus.PENDING : PresenceStatus.APPROVED
        }
      });
    }
  }

  console.log('Seed concluído.');
  console.log({
    admin: admin.email,
    supervisor: supervisor.email,
    employees: employees.map((employee) => employee.email),
    password: '12345678'
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
