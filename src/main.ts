import cookieParser from 'cookie-parser';

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { env } from './config';

async function bootstrap() {
  const logger = new Logger('App - RBAC Template');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger 文档，访问 /api/docs（路径已含 /api/v1，无需 addServer）
  const config = new DocumentBuilder()
    .setTitle('NestJS RBAC Template API')
    .setDescription('基于 NestJS 的 RBAC 权限模板接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.use(cookieParser());

  app.enableCors({
    origin: env.ALLOWED_ORIGINS,
    credentials: true, // 允许前端带 cookie
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(env.PORT);
  logger.log(`Server is running on port ${env.PORT}.`);
}
void bootstrap();
