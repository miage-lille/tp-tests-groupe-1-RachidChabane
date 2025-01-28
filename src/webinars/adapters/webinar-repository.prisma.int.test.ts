// Test d'intégration
// C. Ecriture de notre premier test d'intégrationimport { PrismaClient } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { promisify } from 'util';
const asyncExec = promisify(exec);

describe('PrismaWebinarRepository Integration Tests', () => {
  let container: StartedPostgreSqlContainer;
  let prismaClient: PrismaClient;
  let repository: PrismaWebinarRepository;

  beforeAll(async () => {
    // Démarrer la base de données de test
    container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('user_test')
      .withPassword('password_test')
      .withExposedPorts(5432)
      .start();

    const dbUrl = container.getConnectionUri();
    prismaClient = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });

    // Exécuter les migrations
    await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
    await prismaClient.$connect();
  });

  beforeEach(async () => {
    repository = new PrismaWebinarRepository(prismaClient);
    await prismaClient.webinar.deleteMany();
    await prismaClient.$executeRawUnsafe('DELETE FROM "Webinar" CASCADE');
  });

  afterAll(async () => {
    if (container) {
      await container.stop({ timeout: 1000 });
    }
    if (prismaClient) {
      await prismaClient.$disconnect();
    }
  });

  describe('create', () => {
    it('should create a webinar', async () => {
      const webinar = new Webinar({
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Test Webinar',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T11:00:00Z'),
        seats: 100,
      });

      await repository.create(webinar);

      const saved = await prismaClient.webinar.findUnique({
        where: { id: webinar.props.id },
      });

      expect(saved).toEqual({
        id: webinar.props.id,
        organizerId: webinar.props.organizerId,
        title: webinar.props.title,
        startDate: webinar.props.startDate,
        endDate: webinar.props.endDate,
        seats: webinar.props.seats,
      });
    });
  });

  describe('findById', () => {
    it('should find a webinar by id', async () => {
      const webinarData = {
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Test Webinar',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T11:00:00Z'),
        seats: 100,
      };

      await prismaClient.webinar.create({
        data: webinarData,
      });

      const found = await repository.findById('webinar-id');

      expect(found?.props).toEqual(webinarData);
    });

    it('should return null when webinar not found', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a webinar', async () => {
      // Créer d'abord un webinar
      const webinarData = {
        id: 'webinar-id',
        organizerId: 'organizer-id',
        title: 'Test Webinar',
        startDate: new Date('2024-01-01T10:00:00Z'),
        endDate: new Date('2024-01-01T11:00:00Z'),
        seats: 100,
      };

      await prismaClient.webinar.create({
        data: webinarData,
      });

      // Mettre à jour via le repository
      const webinar = new Webinar(webinarData);
      webinar.update({ seats: 200 });
      await repository.update(webinar);

      // Vérifier la mise à jour
      const updated = await prismaClient.webinar.findUnique({
        where: { id: webinar.props.id },
      });

      expect(updated?.seats).toBe(200);
    });
  });
});
