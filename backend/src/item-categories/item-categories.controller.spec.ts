import { Test, TestingModule } from '@nestjs/testing';
import { ItemCategoriesController } from './item-categories.controller';

describe('ItemCategoriesController', () => {
  let controller: ItemCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemCategoriesController],
    }).compile();

    controller = module.get<ItemCategoriesController>(ItemCategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
