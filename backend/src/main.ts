import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Bật CORS để cho phép Frontend gọi API
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
