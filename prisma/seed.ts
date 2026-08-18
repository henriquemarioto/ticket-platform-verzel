import { PrismaClient, Role, EventCategory, EventStatus, SectorType, SeatStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateTicketQRPayload } from '../src/lib/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga da seed...');

  // Senha padrão para todos os usuários do ambiente de demonstração/testes
  const defaultPassword = 'Senha123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Criar/Atualizar Usuários Base
  const usersData = [
    {
      email: 'organizador@verzel.com.br',
      name: 'Organizador Oficial Verzel',
      role: Role.ORGANIZER,
    },
    {
      email: 'cliente1@verzel.com.br',
      name: 'Lucas Silva (Cliente Primário)',
      role: Role.CUSTOMER,
    },
    {
      email: 'cliente2@verzel.com.br',
      name: 'Camila Santos (Cliente Secundária)',
      role: Role.CUSTOMER,
    },
    {
      email: 'portaria@verzel.com.br',
      name: 'Roberto Validador Portaria',
      role: Role.GATEKEEPER,
    },
  ];

  console.log('Configurando usuários de acesso...');
  const users: Record<string, { id: string; email: string; name: string; role: Role }> = {};

  for (const user of usersData) {
    const record = await prisma.user.upsert({
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
    users[user.email] = record;
  }

  // Limpeza prévia de registros transacionais de eventos anteriores para garantir idempotência
  console.log('Limpando dados transacionais e eventos prévios...');
  await prisma.ticketValidationLog.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.reservationItem.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.seat.deleteMany({});
  await prisma.sector.deleteMany({});
  await prisma.event.deleteMany({});

  const organizerId = users['organizador@verzel.com.br'].id;
  const cliente1Id = users['cliente1@verzel.com.br'].id;
  const cliente2Id = users['cliente2@verzel.com.br'].id;
  const portariaId = users['portaria@verzel.com.br'].id;

  // Função auxiliar para calcular datas futuras relativas a hoje
  const now = new Date();
  const getFutureDate = (daysAhead: number, hours = 20, minutes = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  // 2. Definição do Catálogo com 16 Eventos em Locais Famosos e Reais
  interface SectorDef {
    name: string;
    type: SectorType;
    price: number;
    capacity: number;
    rows?: string[];
    seatsPerRow?: number;
  }

  interface EventDef {
    title: string;
    description: string;
    category: EventCategory;
    bannerUrl: string;
    locationName: string;
    city: string;
    eventDate: Date;
    sectors: SectorDef[];
  }

  const eventsCatalog: EventDef[] = [
    // --- SHOWS ---
    {
      title: 'Festival Indie Rock Verzel 2026',
      description:
        'Uma noite épica com as principais bandas do cenário indie rock contemporâneo.\nEstrutura de som de ponta no tradicional Espaço Unimed, com praça de alimentação gourmet, bar de cervejas artesanais e visão privilegiada da plateia VIP.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
      locationName: 'Espaço Unimed',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(14, 20, 0),
      sectors: [
        { name: 'Pista Geral', type: SectorType.GENERAL_ADMISSION, price: 120.0, capacity: 300 },
        { name: 'Pista Premium Front Stage', type: SectorType.GENERAL_ADMISSION, price: 220.0, capacity: 100 },
        {
          name: 'Plateia VIP Numerada',
          type: SectorType.NUMBERED_SEATS,
          price: 250.0,
          capacity: 30,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 10,
        },
      ],
    },
    {
      title: 'Coldplay Tribute: A Sky Full of Stars Tour',
      description:
        'A maior experiência tributo ao Coldplay da América Latina em um dos estádios mais modernos do mundo!\nUma produção colossal no Allianz Parque com pulseiras de LED sincronizadas, show de luzes laser e todos os grandes hinos da banda britânica.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
      locationName: 'Allianz Parque',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(24, 21, 0),
      sectors: [
        { name: 'Pista Comum', type: SectorType.GENERAL_ADMISSION, price: 160.0, capacity: 500 },
        { name: 'Pista Premium', type: SectorType.GENERAL_ADMISSION, price: 320.0, capacity: 150 },
        {
          name: 'Cadeira Inferior Numerada',
          type: SectorType.NUMBERED_SEATS,
          price: 280.0,
          capacity: 32,
          rows: ['A', 'B', 'C', 'D'],
          seatsPerRow: 8,
        },
      ],
    },
    {
      title: 'Orquestra Sinfônica & Clássicos do Rock',
      description:
        'A fusão perfeita entre a grandiosidade da música clássica e o poder do Rock and Roll no histórico Theatro Municipal do Rio de Janeiro.\nMais de 60 músicos executando arranjos sinfônicos para Queen, Pink Floyd, Led Zeppelin e Metallica.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&q=80',
      locationName: 'Theatro Municipal do Rio de Janeiro',
      city: 'Rio de Janeiro, RJ',
      eventDate: getFutureDate(35, 19, 30),
      sectors: [
        {
          name: 'Plateia Nobre Numerada',
          type: SectorType.NUMBERED_SEATS,
          price: 190.0,
          capacity: 24,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 8,
        },
        {
          name: 'Balcão Nobre Numerado',
          type: SectorType.NUMBERED_SEATS,
          price: 140.0,
          capacity: 20,
          rows: ['A', 'B'],
          seatsPerRow: 10,
        },
        { name: 'Galeria Superior', type: SectorType.GENERAL_ADMISSION, price: 80.0, capacity: 150 },
      ],
    },
    {
      title: 'Noite do Jazz & Blues na Lapa',
      description:
        'Grandes mestres do Jazz e Blues reunidos sob as icônicas lonas do Circo Voador.\nUma atmosfera intimista e acolhedora no coração boêmio da Lapa carioca, com improvisos virtuosos e excelente coquetelaria.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80',
      locationName: 'Circo Voador',
      city: 'Rio de Janeiro, RJ',
      eventDate: getFutureDate(8, 21, 30),
      sectors: [
        { name: 'Ingresso Geral Lote 1', type: SectorType.GENERAL_ADMISSION, price: 90.0, capacity: 250 },
        {
          name: 'Mesa Bistrô Numerada',
          type: SectorType.NUMBERED_SEATS,
          price: 180.0,
          capacity: 16,
          rows: ['A', 'B'],
          seatsPerRow: 8,
        },
      ],
    },
    {
      title: 'Sunset Electronic Beats & DJ Sets',
      description:
        '10 horas ininterruptas de House, Melodic Techno e Progressive com os maiores nomes mundiais da música eletrônica no impressionante cenário de pedreira ao ar livre.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
      locationName: 'Pedreira Paulo Leminski',
      city: 'Curitiba, PR',
      eventDate: getFutureDate(42, 16, 0),
      sectors: [
        { name: 'Pista Sunset', type: SectorType.GENERAL_ADMISSION, price: 140.0, capacity: 400 },
        { name: 'Backstage VIP Open Bar', type: SectorType.GENERAL_ADMISSION, price: 380.0, capacity: 100 },
      ],
    },
    {
      title: 'Nando Reis & Os Paralamas do Sucesso',
      description:
        'Duas lendas do pop rock brasileiro em uma noite de celebração aos maiores clássicos nacionais no histórico Auditório Araújo Vianna em Porto Alegre.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80',
      locationName: 'Auditório Araújo Vianna',
      city: 'Porto Alegre, RS',
      eventDate: getFutureDate(48, 21, 0),
      sectors: [
        {
          name: 'Plateia Baixa Central',
          type: SectorType.NUMBERED_SEATS,
          price: 180.0,
          capacity: 24,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 8,
        },
        {
          name: 'Plateia Alta Lateral',
          type: SectorType.NUMBERED_SEATS,
          price: 130.0,
          capacity: 16,
          rows: ['A', 'B'],
          seatsPerRow: 8,
        },
        { name: 'Pista Lateral', type: SectorType.GENERAL_ADMISSION, price: 90.0, capacity: 200 },
      ],
    },

    // --- FESTIVAIS ---
    {
      title: 'Festival Gastronômico & Cervejeiro Verzel',
      description:
        'Mais de 40 food trucks premiados, 30 cervejarias artesanais paulistas, workshops de culinária e 3 palcos com apresentações ao ar livre na ampla esplanada do Memorial da América Latina.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
      locationName: 'Memorial da América Latina',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(18, 12, 0),
      sectors: [
        { name: 'Passe Diário Geral', type: SectorType.GENERAL_ADMISSION, price: 50.0, capacity: 500 },
        { name: 'Passaporte Weekend (2 Dias)', type: SectorType.GENERAL_ADMISSION, price: 85.0, capacity: 250 },
        { name: 'Experiência VIP Degustação', type: SectorType.GENERAL_ADMISSION, price: 180.0, capacity: 80 },
      ],
    },
    {
      title: 'Aurora Winter Lights & Music Festival',
      description:
        'Um festival sensorial único que combina esculturas e instalações de luzes volumétricas, projeções no lago e shows de música alternativa na icônica estrutura tubular da Ópera de Arame.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
      locationName: 'Ópera de Arame',
      city: 'Curitiba, PR',
      eventDate: getFutureDate(52, 18, 0),
      sectors: [
        { name: 'Entrada Geral Parque + Palco', type: SectorType.GENERAL_ADMISSION, price: 110.0, capacity: 350 },
        {
          name: 'Camarote Panorâmico Numerado',
          type: SectorType.NUMBERED_SEATS,
          price: 220.0,
          capacity: 16,
          rows: ['A', 'B'],
          seatsPerRow: 8,
        },
      ],
    },
    {
      title: 'Bahia Sonora: Festival de Ritmos Brasileiros',
      description:
        'Uma imersão rítmica com samba-reggae, axé raiz, MPB contemporânea e tropicália na mítica Concha Acústica do Teatro Castro Alves, em Salvador.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
      locationName: 'Concha Acústica do Teatro Castro Alves',
      city: 'Salvador, BA',
      eventDate: getFutureDate(65, 17, 0),
      sectors: [
        { name: 'Plateia Arquibancada', type: SectorType.GENERAL_ADMISSION, price: 95.0, capacity: 500 },
        { name: 'Camarote Front TCA', type: SectorType.GENERAL_ADMISSION, price: 210.0, capacity: 150 },
      ],
    },
    {
      title: 'Horror & Sci-Fi CineFest 2026',
      description:
        'Festival cinematográfico temático de terror independente, ficção científica cult e maratonas noitão no tradicionalíssimo Cine Petra Belas Artes da Rua da Consolação.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&q=80',
      locationName: 'Cine Petra Belas Artes',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(21, 18, 30),
      sectors: [
        { name: 'Passaporte Festival Completo', type: SectorType.GENERAL_ADMISSION, price: 130.0, capacity: 180 },
        {
          name: 'Poltronas VIP Sala 1',
          type: SectorType.NUMBERED_SEATS,
          price: 65.0,
          capacity: 24,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 8,
        },
      ],
    },

    // --- TEATRO ---
    {
      title: 'O Fantasma da Ópera: O Musical',
      description:
        'O musical mais aclamado de todos os tempos em superprodução brasileira com orquestra sinfônica ao vivo no Teatro Renault, a principal casa de musicais da América Latina.',
      category: EventCategory.THEATER,
      bannerUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=80',
      locationName: 'Teatro Renault',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(30, 20, 0),
      sectors: [
        {
          name: 'Plateia VIP Central',
          type: SectorType.NUMBERED_SEATS,
          price: 320.0,
          capacity: 30,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 10,
        },
        {
          name: 'Plateia Lateral',
          type: SectorType.NUMBERED_SEATS,
          price: 220.0,
          capacity: 16,
          rows: ['A', 'B'],
          seatsPerRow: 8,
        },
        {
          name: 'Balcão Superior',
          type: SectorType.NUMBERED_SEATS,
          price: 120.0,
          capacity: 20,
          rows: ['A', 'B'],
          seatsPerRow: 10,
        },
      ],
    },
    {
      title: 'O Auto da Compadecida: A Peça Clássica',
      description:
        'A consagrada obra-prima de Ariano Suassuna com João Grilo e Chicó no Grande Teatro do Palácio das Artes em Belo Horizonte. Elenco estelar e música regional ao vivo.',
      category: EventCategory.THEATER,
      bannerUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&q=80',
      locationName: 'Grande Teatro do Palácio das Artes',
      city: 'Belo Horizonte, MG',
      eventDate: getFutureDate(12, 19, 0),
      sectors: [
        {
          name: 'Plateia Baixa Numerada',
          type: SectorType.NUMBERED_SEATS,
          price: 110.0,
          capacity: 24,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 8,
        },
        {
          name: 'Plateia Alta Numerada',
          type: SectorType.NUMBERED_SEATS,
          price: 80.0,
          capacity: 16,
          rows: ['A', 'B'],
          seatsPerRow: 8,
        },
      ],
    },
    {
      title: 'Stand-up Comedy Night: Risos Sem Limites',
      description:
        'Uma noite inesquecível com quatro dos maiores humoristas do país no tradicional Teatro Gazeta, localizado em plena Avenida Paulista.',
      category: EventCategory.THEATER,
      bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&q=80',
      locationName: 'Teatro Gazeta',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(6, 20, 30),
      sectors: [
        {
          name: 'Setor Ouro Numerado',
          type: SectorType.NUMBERED_SEATS,
          price: 90.0,
          capacity: 30,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 10,
        },
        { name: 'Plateia Geral', type: SectorType.GENERAL_ADMISSION, price: 60.0, capacity: 200 },
      ],
    },

    // --- CINEMA ---
    {
      title: 'Interestelar: Edição Especial IMAX 70mm',
      description:
        'A experiência definitiva do clássico de ficção científica de Christopher Nolan exibido na gigantesca tela do UCI IMAX do Bourbon Shopping Pompeia em som imersivo de 12 canais.',
      category: EventCategory.MOVIE,
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
      locationName: 'UCI IMAX Bourbon Shopping',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(5, 21, 0),
      sectors: [
        {
          name: 'Poltronas VIP IMAX',
          type: SectorType.NUMBERED_SEATS,
          price: 72.0,
          capacity: 24,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 8,
        },
        {
          name: 'Poltronas Centrais',
          type: SectorType.NUMBERED_SEATS,
          price: 54.0,
          capacity: 16,
          rows: ['A', 'B'],
          seatsPerRow: 8,
        },
      ],
    },
    {
      title: 'Cine Drive-In Noturno: De Volta Para o Futuro',
      description:
        'Sessão nostálgica ao ar livre no emblemático Cine Drive-in de Brasília, o cinema drive-in em funcionamento contínuo mais antigo e icônico de toda a América Latina.',
      category: EventCategory.MOVIE,
      bannerUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200&q=80',
      locationName: 'Cine Drive-in Brasília',
      city: 'Brasília, DF',
      eventDate: getFutureDate(10, 20, 30),
      sectors: [
        { name: 'Vaga Carro (Até 4 Pessoas)', type: SectorType.GENERAL_ADMISSION, price: 65.0, capacity: 120 },
        { name: 'Vaga Front Row Carro VIP', type: SectorType.GENERAL_ADMISSION, price: 95.0, capacity: 30 },
      ],
    },
    {
      title: 'Maratona O Senhor dos Anéis: Versão Estendida 4K',
      description:
        'A trilogia épica completa em resolução 4K HDR e som Dolby Atmos no clássico cinema cult Estação NET Botafogo no Rio de Janeiro.',
      category: EventCategory.MOVIE,
      bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
      locationName: 'Estação NET Botafogo',
      city: 'Rio de Janeiro, RJ',
      eventDate: getFutureDate(40, 14, 0),
      sectors: [
        {
          name: 'Poltrona Premium Numerada',
          type: SectorType.NUMBERED_SEATS,
          price: 85.0,
          capacity: 24,
          rows: ['A', 'B', 'C'],
          seatsPerRow: 8,
        },
        {
          name: 'Poltrona Meia / Solidário',
          type: SectorType.NUMBERED_SEATS,
          price: 45.0,
          capacity: 16,
          rows: ['D', 'E'],
          seatsPerRow: 8,
        },
      ],
    },
  ];

  console.log(`Criando ${eventsCatalog.length} eventos em locais reais e icônicos...`);

  // Mapas para armazenar referências criadas para relacionamentos de pedidos de teste
  const createdEvents: any[] = [];
  const createdSectorsByEvent: Record<string, any[]> = {};
  const createdSeatsBySector: Record<string, any[]> = {};

  for (const eventDef of eventsCatalog) {
    const event = await prisma.event.create({
      data: {
        title: eventDef.title,
        description: eventDef.description,
        category: eventDef.category,
        bannerUrl: eventDef.bannerUrl,
        locationName: eventDef.locationName,
        city: eventDef.city,
        eventDate: eventDef.eventDate,
        status: EventStatus.PUBLISHED,
        organizerId: organizerId,
      },
    });

    createdEvents.push(event);
    createdSectorsByEvent[event.id] = [];

    for (const sectorDef of eventDef.sectors) {
      const sector = await prisma.sector.create({
        data: {
          eventId: event.id,
          name: sectorDef.name,
          type: sectorDef.type,
          price: sectorDef.price,
          totalCapacity: sectorDef.capacity,
          availableCapacity: sectorDef.capacity,
        },
      });

      createdSectorsByEvent[event.id].push(sector);
      createdSeatsBySector[sector.id] = [];

      // Criar assentos se for setor numerado
      if (sectorDef.type === SectorType.NUMBERED_SEATS && sectorDef.rows && sectorDef.seatsPerRow) {
        for (const row of sectorDef.rows) {
          for (let number = 1; number <= sectorDef.seatsPerRow; number++) {
            const seat = await prisma.seat.create({
              data: {
                sectorId: sector.id,
                row,
                number,
                status: SeatStatus.AVAILABLE,
              },
            });
            createdSeatsBySector[sector.id].push(seat);
          }
        }
      }
    }
  }

  // 3. Pré-popular Pedidos, Ingressos e Validações de Demonstração
  console.log('Gerando pedidos e ingressos de demonstração para os clientes...');

  // Evento 1 (Festival Indie Rock no Espaço Unimed): Lucas compra 1 ingresso VIP numerado (A1) e Camila compra 2 ingressos de Pista Geral
  const indieEvent = createdEvents[0];
  const indieSectors = createdSectorsByEvent[indieEvent.id];
  const indiePista = indieSectors.find((s) => s.type === SectorType.GENERAL_ADMISSION);
  const indieVip = indieSectors.find((s) => s.type === SectorType.NUMBERED_SEATS);
  const indieVipSeats = createdSeatsBySector[indieVip.id];

  if (indieVipSeats && indieVipSeats.length > 0) {
    const seatA1 = indieVipSeats[0];
    const seatA2 = indieVipSeats[1];

    // Marcar A1 como SOLD
    await prisma.seat.update({
      where: { id: seatA1.id },
      data: { status: SeatStatus.SOLD },
    });

    // Marcar A2 como RESERVED temporariamente para demonstrar visual no mapa
    await prisma.seat.update({
      where: { id: seatA2.id },
      data: {
        status: SeatStatus.RESERVED,
        reservedById: cliente2Id,
        reservedUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos TTL
      },
    });

    // Pedido Aprovado de Lucas Silva (cliente1)
    const orderLucas = await prisma.order.create({
      data: {
        customerId: cliente1Id,
        totalAmount: indieVip.price,
        status: 'APPROVED',
        paymentMethod: 'SIMULATED_CREDIT_CARD',
      },
    });

    // Ingresso do Lucas
    const ticketCodeLucas = `ELT-${Math.floor(1000 + Math.random() * 9000)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const shareTokenLucas = crypto.randomUUID();
    const timestampLucas = Math.floor(Date.now() / 1000);
    const { secureToken, qrPayload } = generateTicketQRPayload(ticketCodeLucas, indieEvent.id, timestampLucas);

    await prisma.ticket.create({
      data: {
        orderId: orderLucas.id,
        eventId: indieEvent.id,
        sectorId: indieVip.id,
        seatId: seatA1.id,
        customerId: cliente1Id,
        ticketCode: ticketCodeLucas,
        qrPayload,
        secureToken,
        shareToken: shareTokenLucas,
        status: 'ACTIVE',
      },
    });

    // Atualizar capacidade disponível do setor VIP
    await prisma.sector.update({
      where: { id: indieVip.id },
      data: { availableCapacity: { decrement: 1 } },
    });
  }

  if (indiePista) {
    // Pedido de Camila Santos (cliente2) com 2 ingressos de Pista Geral
    const orderCamila = await prisma.order.create({
      data: {
        customerId: cliente2Id,
        totalAmount: indiePista.price * 2,
        status: 'APPROVED',
        paymentMethod: 'PIX',
      },
    });

    for (let i = 1; i <= 2; i++) {
      const ticketCode = `ELT-${Math.floor(1000 + Math.random() * 9000)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const shareToken = crypto.randomUUID();
      const timestamp = Math.floor(Date.now() / 1000);
      const { secureToken, qrPayload } = generateTicketQRPayload(ticketCode, indieEvent.id, timestamp);

      const ticket = await prisma.ticket.create({
        data: {
          orderId: orderCamila.id,
          eventId: indieEvent.id,
          sectorId: indiePista.id,
          customerId: cliente2Id,
          ticketCode,
          qrPayload,
          secureToken,
          shareToken,
          status: i === 1 ? 'USED' : 'ACTIVE', // 1 já validado na portaria, 1 ativo
          usedAt: i === 1 ? new Date(Date.now() - 30 * 60 * 1000) : null,
        },
      });

      // Se foi marcado como USED, cria o log de validação correspondente
      if (i === 1) {
        await prisma.ticketValidationLog.create({
          data: {
            ticketId: ticket.id,
            gatekeeperId: portariaId,
            result: 'VALID',
            rawPayload: qrPayload,
            message: 'Acesso Liberado com Sucesso',
            validatedAt: new Date(Date.now() - 30 * 60 * 1000),
          },
        });
      }
    }

    // Decrementar capacidade da pista
    await prisma.sector.update({
      where: { id: indiePista.id },
      data: { availableCapacity: { decrement: 2 } },
    });
  }

  // Evento Interestelar (UCI IMAX Bourbon Shopping): Lucas compra 1 assento VIP (B4)
  const imaxEvent = createdEvents.find((e) => e.title.includes('Interestelar'));
  if (imaxEvent) {
    const imaxSectors = createdSectorsByEvent[imaxEvent.id];
    const imaxVipSector = imaxSectors.find((s) => s.name.includes('VIP'));
    const imaxSeats = createdSeatsBySector[imaxVipSector?.id];

    if (imaxVipSector && imaxSeats && imaxSeats.length > 3) {
      const seatB4 = imaxSeats[3];
      await prisma.seat.update({
        where: { id: seatB4.id },
        data: { status: SeatStatus.SOLD },
      });

      const orderImax = await prisma.order.create({
        data: {
          customerId: cliente1Id,
          totalAmount: imaxVipSector.price,
          status: 'APPROVED',
          paymentMethod: 'SIMULATED_CREDIT_CARD',
        },
      });

      const ticketCodeImax = `ELT-${Math.floor(1000 + Math.random() * 9000)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const shareTokenImax = crypto.randomUUID();
      const timestampImax = Math.floor(Date.now() / 1000);
      const { secureToken, qrPayload } = generateTicketQRPayload(ticketCodeImax, imaxEvent.id, timestampImax);

      await prisma.ticket.create({
        data: {
          orderId: orderImax.id,
          eventId: imaxEvent.id,
          sectorId: imaxVipSector.id,
          seatId: seatB4.id,
          customerId: cliente1Id,
          ticketCode: ticketCodeImax,
          qrPayload,
          secureToken,
          shareToken: shareTokenImax,
          status: 'ACTIVE',
        },
      });

      await prisma.sector.update({
        where: { id: imaxVipSector.id },
        data: { availableCapacity: { decrement: 1 } },
      });
    }
  }

  console.log('Carga com locais 100% reais e famosos finalizada com sucesso!');
  console.log(`Estatísticas:`);
  console.log(`   - Total de Eventos: ${eventsCatalog.length}`);
  console.log(`   - Locais Reais cadastrados:`);
  eventsCatalog.forEach((e) => {
    console.log(`     ${e.title} -> ${e.locationName} (${e.city})`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erro no script de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
