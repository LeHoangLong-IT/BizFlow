import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.event.findMany({ 
      where: { userId },
      include: { category: true }
    });
  }

  async create(userId: number, data: Omit<Prisma.EventUncheckedCreateInput, 'userId'>) {
    return this.prisma.event.create({
      data: {
        ...data,
        userId: userId,
      },
    });
  }

  async update(userId: number, id: number, data: Prisma.EventUncheckedUpdateInput) {
    const event = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.event.update({
      where: { id },
      data,
    });
  }

  async remove(userId: number, id: number) {
    const event = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.event.delete({ where: { id } });
  }
}
