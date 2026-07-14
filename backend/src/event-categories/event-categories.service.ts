import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createDto: { name: string; color: string }) {
    return this.prisma.eventCategory.create({
      data: {
        userId,
        name: createDto.name,
        color: createDto.color,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.eventCategory.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
  }

  async update(userId: number, id: number, updateDto: { name?: string; color?: string }) {
    const category = await this.prisma.eventCategory.findFirst({
      where: { id, userId },
    });
    if (!category) {
      throw new NotFoundException('Event category not found');
    }

    return this.prisma.eventCategory.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(userId: number, id: number) {
    const category = await this.prisma.eventCategory.findFirst({
      where: { id, userId },
    });
    if (!category) {
      throw new NotFoundException('Event category not found');
    }

    return this.prisma.eventCategory.delete({
      where: { id },
    });
  }
}
