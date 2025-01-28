import supertest from 'supertest';
import { TestServerFixture } from './tests/fixtures';

describe('Webinar Routes E2E', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  describe('POST /webinars/:id/seats', () => {
    it('should update webinar seats', async () => {
      // ARRANGE
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      const webinar = await prisma.webinar.create({
        data: {
          id: 'test-webinar',
          title: 'Webinar Test',
          seats: 10,
          startDate: new Date(),
          endDate: new Date(),
          organizerId: 'test-user',
        },
      });

      // ACT
      const response = await supertest(server)
        .post(`/webinars/${webinar.id}/seats`)
        .send({ seats: '30' })
        .expect(200);

      // ASSERT
      expect(response.body).toEqual({ message: 'Seats updated' });

      const updatedWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.id },
      });
      expect(updatedWebinar?.seats).toBe(30);
    });

    it('should return 404 when webinar not found', async () => {
      // ARRANGE
      const server = fixture.getServer();

      // ACT & ASSERT
      const response = await supertest(server)
        .post('/webinars/non-existing-id/seats')
        .send({ seats: '30' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Webinar not found' });
    });

    it('should return 401 when user is not organizer', async () => {
      // ARRANGE
      const prisma = fixture.getPrismaClient();
      const server = fixture.getServer();

      // Créer un webinar avec un autre organizerId
      const webinar = await prisma.webinar.create({
        data: {
          id: 'test-webinar',
          title: 'Webinar Test',
          seats: 10,
          startDate: new Date(),
          endDate: new Date(),
          organizerId: 'other-user',
        },
      });

      // ACT & ASSERT
      const response = await supertest(server)
        .post(`/webinars/${webinar.id}/seats`)
        .send({ seats: '30' })
        .expect(401);

      expect(response.body).toEqual({
        error: 'User is not allowed to update this webinar',
      });

      // Vérifier que les places n'ont pas été modifiées
      const unchangedWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.id },
      });
      expect(unchangedWebinar?.seats).toBe(10);
    });
  });
});

describe('POST /webinars', () => {
  let fixture: TestServerFixture;

  beforeAll(async () => {
    fixture = new TestServerFixture();
    await fixture.init();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  afterAll(async () => {
    await fixture.stop();
  });

  it('should create a new webinar', async () => {
    // ARRANGE
    const server = fixture.getServer();
    const prisma = fixture.getPrismaClient();

    const webinarData = {
      title: 'E2E Test Webinar',
      seats: 100,
      startDate: '2024-12-31T10:00:00.000Z',
      endDate: '2024-12-31T12:00:00.000Z',
    };

    // ACT
    const response = await supertest(server)
      .post('/webinars')
      .send(webinarData)
      .expect(201);

    // ASSERT
    expect(response.body).toHaveProperty('id');

    const webinar = await prisma.webinar.findUnique({
      where: { id: response.body.id },
    });

    expect(webinar).toMatchObject({
      id: response.body.id,
      title: webinarData.title,
      seats: webinarData.seats,
      startDate: new Date(webinarData.startDate),
      endDate: new Date(webinarData.endDate),
    });
  });

  it('should return 400 when dates are too soon', async () => {
    // ARRANGE
    const server = fixture.getServer();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ACT & ASSERT
    const response = await supertest(server)
      .post('/webinars')
      .send({
        title: 'Too Soon Webinar',
        seats: 100,
        startDate: tomorrow.toISOString(),
        endDate: tomorrow.toISOString(),
      })
      .expect(400);

    expect(response.body).toEqual({
      error: 'Webinar must be scheduled at least 3 days in advance',
    });
  });

  it('should return 400 when seats are invalid', async () => {
    // ARRANGE
    const server = fixture.getServer();

    // ACT & ASSERT
    const response = await supertest(server)
      .post('/webinars')
      .send({
        title: 'Invalid Seats Webinar',
        seats: 1001,
        startDate: '2024-12-31T10:00:00.000Z',
        endDate: '2024-12-31T12:00:00.000Z',
      })
      .expect(400);

    expect(response.body).toEqual({
      error: 'Webinar must have at most 1000 seats',
    });
  });
});
