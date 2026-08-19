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
    isAdult?: boolean;
    sectors: SectorDef[];
  }

  const eventsCatalog: EventDef[] = [
    // --- SHOWS ---
    {
      title: 'Festival Indie Rock Verzel 2026',
      description:
        'Prepare-se para uma noite lendária com as bandas mais aclamadas do cenário indie rock nacional e internacional reunidas em um único palco. O Espaço Unimed contará com uma infraestrutura acústica de última geração, iluminação imersiva, praça de alimentação gourmet com food trucks selecionados e lounges exclusivos para proporcionar uma experiência inesquecível a todos os fãs de boa música.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&q=80',
      locationName: 'Espaço Unimed',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(14, 20, 0),
      isAdult: false,
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
        'A maior e mais espetacular homenagem ao Coldplay de toda a América Latina desembarca no Allianz Parque para uma apresentação monumental. O espetáculo traz uma réplica fiel dos shows de estádio da banda britânica, com pulseiras de LED sincronizadas distribuídas ao público, show pirotécnico inesquecível, lasers multicoloridos e um repertório com todos os grandes sucessos da carreira.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
      locationName: 'Allianz Parque',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(24, 21, 0),
      isAdult: false,
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
        'Uma fusão arrebatadora entre a sofisticação da música erudita e a energia visceral do rock and roll no imponente Theatro Municipal do Rio de Janeiro. Sob a regência de maestros renomados, mais de 60 músicos de orquestra executam arranjos sinfônicos inéditos para lendas como Queen, Pink Floyd, Led Zeppelin, Metallica e Deep Purple, criando uma atmosfera acústica emocionante e grandiosa.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&q=80',
      locationName: 'Theatro Municipal do Rio de Janeiro',
      city: 'Rio de Janeiro, RJ',
      eventDate: getFutureDate(35, 19, 30),
      isAdult: false,
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
        'Uma celebração intimista e vibrante das raízes do Jazz tradicional e Blues clássico sob a mítica lona do Circo Voador, no coração boêmio da Lapa carioca. O evento reúne virtuosos instrumentistas, cantores convidados, cartas de coquetelaria autoral premiada e mesas bistrô para uma noite sofisticada voltada ao público apreciador de boa música e gastronomia noturna refinada.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&q=80',
      locationName: 'Circo Voador',
      city: 'Rio de Janeiro, RJ',
      eventDate: getFutureDate(8, 21, 30),
      isAdult: true,
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
        'Mais de dez horas ininterruptas de celebração ao som do melhor do Melodic Techno, Progressive House e Deep House no cenário paradisíaco da Pedreira Paulo Leminski. Com cenografia monumental inspirada nos maiores festivais europeus, DJs de renome internacional, open bar premium no setor VIP e praça gastronômica noturna, este é o evento eletrônico definitivo da temporada.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
      locationName: 'Pedreira Paulo Leminski',
      city: 'Curitiba, PR',
      eventDate: getFutureDate(42, 16, 0),
      isAdult: true,
      sectors: [
        { name: 'Pista Sunset', type: SectorType.GENERAL_ADMISSION, price: 140.0, capacity: 400 },
        { name: 'Backstage VIP Open Bar', type: SectorType.GENERAL_ADMISSION, price: 380.0, capacity: 100 },
      ],
    },
    {
      title: 'Nando Reis & Os Paralamas do Sucesso',
      description:
        'Dois dos maiores ícones da história do pop rock brasileiro dividem o palco do lendário Auditório Araújo Vianna em Porto Alegre para um show histórico e emocionante. Uma noite repleta de poesia, guitarras marcantes e refrões inesquecíveis que atravessaram gerações, contando com produção técnica impecável e setores planejados para total conforto e visão panorâmica da plateia.',
      category: EventCategory.SHOW,
      bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=80',
      locationName: 'Auditório Araújo Vianna',
      city: 'Porto Alegre, RS',
      eventDate: getFutureDate(48, 21, 0),
      isAdult: false,
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
        'O maior encontro de sabores, cultura e cervejas artesanais de São Paulo chega à grandiosa esplanada do Memorial da América Latina. O evento conta com mais de quarenta operações gastronômicas premiadas, trinta mestres cervejeiros locais, três palcos simultâneos com música ao vivo, workshops culinários interativos e espaço exclusivo para toda a família desfrutar de momentos memoráveis.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80',
      locationName: 'Memorial da América Latina',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(18, 12, 0),
      isAdult: false,
      sectors: [
        { name: 'Passe Diário Geral', type: SectorType.GENERAL_ADMISSION, price: 50.0, capacity: 500 },
        { name: 'Passaporte Weekend (2 Dias)', type: SectorType.GENERAL_ADMISSION, price: 85.0, capacity: 250 },
        { name: 'Experiência VIP Degustação', type: SectorType.GENERAL_ADMISSION, price: 180.0, capacity: 80 },
      ],
    },
    {
      title: 'Aurora Winter Lights & Music Festival',
      description:
        'Uma experiência multissensorial deslumbrante que transforma a arquitetura icônica da Ópera de Arame em uma instalação viva de arte e som. O festival une esculturas lumínicas futuristas, projeções holográficas sobre as águas do lago e apresentações ao vivo de indie folk, ambient e synth-pop, criando uma atmosfera mágica e imersiva sem precedentes na cena cultural de Curitiba.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80',
      locationName: 'Ópera de Arame',
      city: 'Curitiba, PR',
      eventDate: getFutureDate(52, 18, 0),
      isAdult: false,
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
        'Uma celebração contagiante da rica herança musical afro-brasileira no palco sagrado da Concha Acústica do Teatro Castro Alves em Salvador. O festival une apresentações consagradas de samba-reggae, axé raiz, MPB contemporânea e blocos afro tradicionais, proporcionando uma experiência cultural intensa, cheia de energia positiva e com estrutura de excelência para o público.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&q=80',
      locationName: 'Concha Acústica do Teatro Castro Alves',
      city: 'Salvador, BA',
      eventDate: getFutureDate(65, 17, 0),
      isAdult: false,
      sectors: [
        { name: 'Plateia Arquibancada', type: SectorType.GENERAL_ADMISSION, price: 95.0, capacity: 500 },
        { name: 'Camarote Front TCA', type: SectorType.GENERAL_ADMISSION, price: 210.0, capacity: 150 },
      ],
    },
    {
      title: 'Horror & Sci-Fi CineFest 2026',
      description:
        'O tradicional festival dedicado ao cinema de gênero desembarca no histórico Cine Petra Belas Artes para noites eletrizantes de horror psicológico, ficção científica cult e maratonas noitão madrugada adentro. Com debates com diretores, exibição de cópias restauradas em altíssima definição e experiências imersivas no lobby, esta edição será inesquecível para todos os amantes da sétima arte.',
      category: EventCategory.FESTIVAL,
      bannerUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&q=80',
      locationName: 'Cine Petra Belas Artes',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(21, 18, 30),
      isAdult: true,
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
        'A obra-prima definitiva de Andrew Lloyd Webber ganha vida no palco do grandioso Teatro Renault em uma superprodução com elenco estelar e orquestra sinfônica ao vivo. Figurinos deslumbrantes originais da Broadway, cenários suntuosos e efeitos cênicos de tirar o fôlego recriam a clássica e comovente história de amor nos subterrâneos da Ópera de Paris com máxima fidelidade e emoção.',
      category: EventCategory.THEATER,
      bannerUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200&q=80',
      locationName: 'Teatro Renault',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(30, 20, 0),
      isAdult: false,
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
        'A consagrada obra-prima de Ariano Suassuna ganha nova e emocionante montagem no palco principal do Grande Teatro do Palácio das Artes em Belo Horizonte. As hilariantes peripécias de João Grilo e Chicó no sertão paraibano ganham vida com elenco estelar, banda regional executando trilha sonora ao vivo e uma cenografia primorosa que homenageia a rica cultura e poesia popular nordestina.',
      category: EventCategory.THEATER,
      bannerUrl: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=1200&q=80',
      locationName: 'Grande Teatro do Palácio das Artes',
      city: 'Belo Horizonte, MG',
      eventDate: getFutureDate(12, 19, 0),
      isAdult: false,
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
        'Uma noite inesquecível de gargalhadas garantidas no tradicional palco do Teatro Gazeta, no coração da Avenida Paulista. Quatro dos maiores comediantes da atualidade apresentam textos 100% inéditos, piadas ácidas, improvisos hilários e observações cotidianas afiadas em um espetáculo descontraído e dinâmico, recomendado para maiores de 18 anos que buscam diversão de alto nível.',
      category: EventCategory.THEATER,
      bannerUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200&q=80',
      locationName: 'Teatro Gazeta',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(6, 20, 30),
      isAdult: true,
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
        'A obra-prima cinematográfica de Christopher Nolan retorna com toda a sua magnitude na gigantesca tela do UCI IMAX do Bourbon Shopping Pompeia. Vivencie a épica jornada interestelar através de um buraco de minhoca com imagem cristalina em alta definição e som imersivo de 12 canais com a inconfundível trilha sonora de Hans Zimmer, oferecendo uma experiência imersiva sem igual.',
      category: EventCategory.MOVIE,
      bannerUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&q=80',
      locationName: 'UCI IMAX Bourbon Shopping',
      city: 'São Paulo, SP',
      eventDate: getFutureDate(5, 21, 0),
      isAdult: false,
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
        'Reviva a magia e nostalgia dos anos oitenta no histórico e emblemático Cine Drive-in de Brasília, o mais tradicional cinema ao ar livre em operação contínua da América Latina. Assista à lendária aventura de Marty McFly e Doc Brown no conforto do seu veículo, com transmissão de áudio FM estéreo de alta fidelidade e serviço exclusivo de lanchonete retrô entregue diretamente no carro.',
      category: EventCategory.MOVIE,
      bannerUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=1200&q=80',
      locationName: 'Cine Drive-in Brasília',
      city: 'Brasília, DF',
      eventDate: getFutureDate(10, 20, 30),
      isAdult: false,
      sectors: [
        { name: 'Vaga Carro (Até 4 Pessoas)', type: SectorType.GENERAL_ADMISSION, price: 65.0, capacity: 120 },
        { name: 'Vaga Front Row Carro VIP', type: SectorType.GENERAL_ADMISSION, price: 95.0, capacity: 30 },
      ],
    },
    {
      title: 'Maratona O Senhor dos Anéis: Versão Estendida 4K',
      description:
        'A lendária trilogia épica dirigida por Peter Jackson retorna às telonas em resolução 4K HDR e som imersivo Dolby Atmos no clássico cinema cult Estação NET Botafogo. Serão exibidas em sequência as versões estendidas completas com cenas extras exclusivas, permitindo que os fãs mergulhem profundamente na fantástica jornada pela Terra-média com qualidade audiovisual cinematográfica máxima.',
      category: EventCategory.MOVIE,
      bannerUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80',
      locationName: 'Estação NET Botafogo',
      city: 'Rio de Janeiro, RJ',
      eventDate: getFutureDate(40, 14, 0),
      isAdult: false,
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
        isAdult: eventDef.isAdult ?? false,
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
