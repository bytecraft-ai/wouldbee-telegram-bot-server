import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { get } from 'config';
import { Logger } from "nestjs-pino";

require('dotenv').config();
const serverConfig = get('server');

// import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked';
import { readFileSync } from 'fs';


async function bootstrap() {

  // const logger = new Logger('main: bootstrap');

  initializeTransactionalContext() // Initialize cls-hooked for typeorm transaction.
  patchTypeORMRepositoryWithBaseRepository() // patch Repository with BaseRepository.

  const nodeEnv = process.env.NODE_ENV || 'development';

  const httpsOptions = {
    key: nodeEnv === 'production' ? readFileSync('./secrets/private-key.pem') : '',
    cert: nodeEnv === 'production' ? readFileSync('./secrets/public-certificate.pem') : '',
  };

  const app = process.env.NODE_ENV === 'production'
    ? await NestFactory.create<NestExpressApplication>(
      AppModule, { logger: false })
    : await NestFactory.create<NestExpressApplication>(
      AppModule, { httpsOptions, logger: false });

  app.useLogger(app.get(Logger));

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  await app.listen(process.env.SERVER_PORT || serverConfig.port);
  console.log(`Application listening on port ${process.env.SERVER_PORT || serverConfig.port}`);
}
bootstrap();