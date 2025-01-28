import { PrismaClient } from '@prisma/client';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { ChangeSeats } from 'src/webinars/use-cases/change-seats';
import { OrganizeWebinars } from 'src/webinars/use-cases/organize-webinar';
import { RealDateGenerator } from 'src/core/adapters/real-date-generator';
import { RealIdGenerator } from 'src/core/adapters/real-id-generator';

export class AppContainer {
  private prismaClient!: PrismaClient;
  private webinarRepository!: PrismaWebinarRepository;
  private changeSeatsUseCase!: ChangeSeats;
  private organizeWebinarUseCase!: OrganizeWebinars;

  init(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
    this.webinarRepository = new PrismaWebinarRepository(this.prismaClient);
    this.changeSeatsUseCase = new ChangeSeats(this.webinarRepository);
    this.organizeWebinarUseCase = new OrganizeWebinars(
      this.webinarRepository,
      new RealIdGenerator(),
      new RealDateGenerator(),
    );
  }

  getPrismaClient() {
    return this.prismaClient;
  }

  getChangeSeatsUseCase() {
    return this.changeSeatsUseCase;
  }

  getOrganizeWebinarUseCase() {
    return this.organizeWebinarUseCase;
  }
}

export const container = new AppContainer();
