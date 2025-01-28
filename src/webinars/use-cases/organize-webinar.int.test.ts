import { PrismaClient } from '@prisma/client';
import { TestServerFixture } from 'src/tests/fixtures';
import { OrganizeWebinars } from './organize-webinar';
import { RealIdGenerator } from 'src/core/adapters/real-id-generator';
import { RealDateGenerator } from 'src/core/adapters/real-date-generator';
import { PrismaWebinarRepository } from '../adapters/webinar-repository.prisma';

describe('Feature: Organize webinar integration', () => {
  let fixture: TestServerFixture;
  let useCase: OrganizeWebinars;
  let prismaClient: PrismaClient;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
    prismaClient = fixture.getPrismaClient();

    const repository = new PrismaWebinarRepository(prismaClient);
    const idGenerator = new RealIdGenerator();
    const dateGenerator = new RealDateGenerator();
    useCase = new OrganizeWebinars(repository, idGenerator, dateGenerator);
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  it('should create a new webinar in database', async () => {
    // ARRANGE
    const payload = {
      userId: 'user-1',
      title: 'Integration Test Webinar',
      seats: 100,
      startDate: new Date('2024-12-31T10:00:00.000Z'),
      endDate: new Date('2024-12-31T12:00:00.000Z'),
    };

    // ACT
    const result = await useCase.execute(payload);

    // ASSERT
    const webinar = await prismaClient.webinar.findUnique({
      where: { id: result.id },
    });

    expect(webinar).toMatchObject({
      id: result.id,
      organizerId: payload.userId,
      title: payload.title,
      seats: payload.seats,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });
  });
});
