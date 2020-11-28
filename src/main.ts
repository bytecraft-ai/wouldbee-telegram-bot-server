import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked';
import { createTempDirs } from './common/file-util';
import { get } from 'config';
import { Logger as NestPinoLogger } from "nestjs-pino";

require('dotenv').config();
const serverConfig = get('server');

const logger = new Logger();

const nodeEnv = process.env.NODE_ENV || 'development';
console.log('nodeEnv:', nodeEnv);

async function bootstrap() {
  // Initialize cls-hooked for typeorm transaction.
  initializeTransactionalContext();

  // patch Repository with BaseRepository.
  patchTypeORMRepositoryWithBaseRepository();

  let app: NestExpressApplication;

  if (nodeEnv === 'production') {
    app = await NestFactory.create<NestExpressApplication>(
      AppModule, { logger: false });
    app.useLogger(app.get(Logger));
  } else {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
  }

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  // create temporary directories for file processing
  createTempDirs();

  await app.listen(process.env.SERVER_PORT || serverConfig.port);
  console.log(`Application listening on port ${process.env.SERVER_PORT || serverConfig.port}`);
}

bootstrap();