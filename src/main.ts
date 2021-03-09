import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked';
import { createTempDirs } from './common/file-util';
import { Logger as NestPinoLogger } from "nestjs-pino";

require('dotenv').config();
import { get } from 'config';
const serverConfig = get('server');

const logger = new Logger();

const nodeEnv = process.env.NODE_ENV || 'development';
const usePinoLogger = process.env.USE_PINO_LOGGER === 'true';

console.log('[main] nodeEnv:', nodeEnv, 'usePinoLogger:', usePinoLogger);

async function bootstrap() {
  // Initialize cls-hooked for typeorm transaction.
  initializeTransactionalContext();

  // patch Repository with BaseRepository.
  patchTypeORMRepositoryWithBaseRepository();

  let app: NestExpressApplication;

  if (nodeEnv === 'production' && usePinoLogger) {
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