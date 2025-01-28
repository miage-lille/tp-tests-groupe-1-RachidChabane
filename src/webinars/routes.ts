import { FastifyInstance } from 'fastify';
import { AppContainer } from 'src/container';
import { User } from 'src/users/entities/user.entity';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { WebinarDatesTooSoonException } from 'src/webinars/exceptions/webinar-dates-too-soon';
import { WebinarNotEnoughSeatsException } from 'src/webinars/exceptions/webinar-not-enough-seats';
import { WebinarTooManySeatsException } from 'src/webinars/exceptions/webinar-too-many-seats';

export async function webinarRoutes(
  fastify: FastifyInstance,
  container: AppContainer,
) {
  const changeSeatsUseCase = container.getChangeSeatsUseCase();

  fastify.post<{
    Body: { seats: string };
    Params: { id: string };
  }>('/webinars/:id/seats', {}, async (request, reply) => {
    const changeSeatsCommand = {
      seats: parseInt(request.body.seats, 10),
      webinarId: request.params.id,
      user: new User({
        id: 'test-user',
        email: 'test@test.com',
        password: 'fake',
      }),
    };

    try {
      await changeSeatsUseCase.execute(changeSeatsCommand);
      reply.status(200).send({ message: 'Seats updated' });
    } catch (err) {
      if (err instanceof WebinarNotFoundException) {
        return reply.status(404).send({ error: err.message });
      }
      if (err instanceof WebinarNotOrganizerException) {
        return reply.status(401).send({ error: err.message });
      }
      reply.status(500).send({ error: 'An error occurred' });
    }
  });
  fastify.post<{
    Body: {
      title: string;
      seats: number;
      startDate: string;
      endDate: string;
    };
  }>('/webinars', {}, async (request, reply) => {
    const organizeWebinarUseCase = container.getOrganizeWebinarUseCase();

    try {
      const result = await organizeWebinarUseCase.execute({
        userId: 'test-user', // In a real app, this would come from auth
        title: request.body.title,
        seats: request.body.seats,
        startDate: new Date(request.body.startDate),
        endDate: new Date(request.body.endDate),
      });

      return reply.status(201).send(result);
    } catch (err) {
      if (
        err instanceof WebinarDatesTooSoonException ||
        err instanceof WebinarTooManySeatsException ||
        err instanceof WebinarNotEnoughSeatsException
      ) {
        return reply.status(400).send({ error: err.message });
      }
      reply.status(500).send({ error: 'An error occurred' });
    }
  });
}
