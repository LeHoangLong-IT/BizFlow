import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ItemCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.itemCategory.findMany({ where: { userId } });
  }

  async create(userId: number, data: { name: string; color?: string }) {
    return this.prisma.itemCategory.create({
      data: { ...data, userId }
    });
  }

  async update(userId: number, id: number, data: { name?: string; color?: string }) {
    const category = await this.prisma.itemCategory.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.itemCategory.update({ where: { id }, data });
  }

  async remove(userId: number, id: number) {
    const category = await this.prisma.itemCategory.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Category not found');
    return this.prisma.itemCategory.delete({ where: { id } });
  }
}
