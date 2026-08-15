import { PrismaClient, Role, EventCategory, EventStatus, SectorType, SeatStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando pipeline de carga (Seed)...');

  // Hashing default password
  const defaultPassword = 'Senha123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Criar/Atualizar Usuários
  const users = [
    {
      email: 'organizador@verzel.com.br',
      name: 'Organizador Oficial Verzel',
      role: Role.ORGANIZER,
    },
    {
      email: 'cliente1@verzel.com.br',
      name: 'Lucas Cliente Primário',
      role: Role.CUSTOMER,
    },
    {
      email: 'cliente2@verzel.com.br',
      name: 'Camila Cliente Secundária',
      role: Role.CUSTOMER,
    },
    {
      email: 'portaria@verzel.com.br',
      name: 'Roberto Validador Portaria',
      role: Role.GATEKEEPER,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }

  // 2. Criar/Atualizar Evento
  const organizer = await prisma.user.findUnique({ where: { email: 'organizador@verzel.com.br' } });
  if (!organizer) throw new Error('Organizador não encontrado!');

  const eventTitle = 'Festival Indie Rock Verzel 2026';
  
  // Como não há um campo unique fácil além do ID que não temos, vamos usar findFirst
  let event = await prisma.event.findFirst({
    where: { title: eventTitle },
  });

  if (event) {
    event = await prisma.event.update({
      where: { id: event.id },
      data: {
        description: 'Uma noite épica com as melhores bandas do cenário independente nacional e internacional. Estrutura completa de som, praça de alimentação e mapa de assentos exclusivo.',
        category: EventCategory.SHOW,
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
        locationName: 'Espaço Hall Cultural Verzel',
        city: 'São Paulo, SP',
        eventDate: new Date('2026-11-20T20:00:00Z'),
        status: EventStatus.PUBLISHED,
        organizerId: organizer.id,
      },
    });
  } else {
    event = await prisma.event.create({
      data: {
        title: eventTitle,
        description: 'Uma noite épica com as melhores bandas do cenário independente nacional e internacional. Estrutura completa de som, praça de alimentação e mapa de assentos exclusivo.',
        category: EventCategory.SHOW,
        bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
        locationName: 'Espaço Hall Cultural Verzel',
        city: 'São Paulo, SP',
        eventDate: new Date('2026-11-20T20:00:00Z'),
        status: EventStatus.PUBLISHED,
        organizerId: organizer.id,
      },
    });
  }

  // 3. Criar/Atualizar Setores
  // Pista Geral
  let pista = await prisma.sector.findFirst({
    where: { eventId: event.id, name: 'Pista Geral' },
  });

  if (!pista) {
    pista = await prisma.sector.create({
      data: {
        eventId: event.id,
        name: 'Pista Geral',
        type: SectorType.GENERAL_ADMISSION,
        price: 120.00,
        totalCapacity: 200,
        availableCapacity: 200,
      },
    });
  }

  // Plateia VIP
  let vip = await prisma.sector.findFirst({
    where: { eventId: event.id, name: 'Plateia VIP Numerada' },
  });

  if (!vip) {
    vip = await prisma.sector.create({
      data: {
        eventId: event.id,
        name: 'Plateia VIP Numerada',
        type: SectorType.NUMBERED_SEATS,
        price: 250.00,
        totalCapacity: 30,
        availableCapacity: 30,
      },
    });
  } else {
    // Reset capacities for idempotency
    await prisma.sector.update({
      where: { id: vip.id },
      data: {
        totalCapacity: 30,
        availableCapacity: 30,
      }
    });
  }

  // 4. Criar/Atualizar Assentos VIP
  const rows = ['A', 'B', 'C'];
  
  for (const row of rows) {
    for (let number = 1; number <= 10; number++) {
      const existingSeat = await prisma.seat.findUnique({
        where: {
          sectorId_row_number: {
            sectorId: vip.id,
            row,
            number,
          }
        }
      });
      
      if (!existingSeat) {
        await prisma.seat.create({
          data: {
            sectorId: vip.id,
            row,
            number,
            status: SeatStatus.AVAILABLE,
          }
        });
      } else {
        await prisma.seat.update({
          where: { id: existingSeat.id },
          data: {
            status: SeatStatus.AVAILABLE,
            reservedById: null,
            reservedUntil: null,
          }
        });
      }
    }
  }

  console.log('✅ Carga inicial finalizada com sucesso!');
  console.table(
    users.map(u => ({
      Nome: u.name,
      'E-mail': u.email,
      'Senha': defaultPassword,
      Papel: u.role,
    }))
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro no script de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
