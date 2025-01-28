// Tests unitaires
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { testUser } from 'src/users/tests/user-seeds';
import { ChangeSeats } from './change-seats';

describe('Feature: Change seats', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let useCase: ChangeSeats;

  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Webinar title',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: new Date('2024-01-01T01:00:00Z'),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    useCase = new ChangeSeats(webinarRepository);
  });

  // Méthodes partagées pour rendre les tests plus lisibles
  async function whenUserChangesSeatsTo(
    seats: number,
    user = testUser.alice,
    webinarId = 'webinar-id',
  ) {
    return useCase.execute({
      user,
      webinarId,
      seats,
    });
  }

  async function thenWebinarSeatsShouldBe(expectedSeats: number) {
    const updatedWebinar = await webinarRepository.findById('webinar-id');
    expect(updatedWebinar?.props.seats).toBe(expectedSeats);
  }

  function expectWebinarToRemainUnchanged() {
    const webinar = webinarRepository.findByIdSync('webinar-id');
    expect(webinar?.props.seats).toBe(100);
  }

  describe('Scenario: happy path', () => {
    it('should change the number of seats for a webinar', async () => {
      await whenUserChangesSeatsTo(200);
      await thenWebinarSeatsShouldBe(200);
    });
  });

  describe('Scenario: webinar does not exist', () => {
    it('should fail with WebinarNotFoundException', async () => {
      await expect(
        whenUserChangesSeatsTo(200, testUser.alice, 'non-existing-id'),
      ).rejects.toThrow('Webinar not found');
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: update the webinar of someone else', () => {
    it('should fail with WebinarNotOrganizerException', async () => {
      await expect(whenUserChangesSeatsTo(200, testUser.bob)).rejects.toThrow(
        'User is not allowed to update this webinar',
      );
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: change seat to an inferior number', () => {
    it('should fail with WebinarReduceSeatsException', async () => {
      await expect(whenUserChangesSeatsTo(50)).rejects.toThrow(
        'You cannot reduce the number of seats',
      );
      expectWebinarToRemainUnchanged();
    });
  });

  describe('Scenario: change seat to a number > 1000', () => {
    it('should fail with WebinarTooManySeatsException', async () => {
      await expect(whenUserChangesSeatsTo(1001)).rejects.toThrow(
        'Webinar must have at most 1000 seats',
      );
      expectWebinarToRemainUnchanged();
    });
  });
});
