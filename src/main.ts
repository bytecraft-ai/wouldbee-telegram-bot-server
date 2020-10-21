import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { get } from 'config';

require('dotenv').config();
const serverConfig = get('server');

import { Logger } from '@nestjs/common';

import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository
} from 'typeorm-transactional-cls-hooked';


async function bootstrap() {

  const logger = new Logger('main: bootstrap');
  initializeTransactionalContext() // Initialize cls-hooked for typeorm transaction.
  patchTypeORMRepositoryWithBaseRepository() // patch Repository with BaseRepository.

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(process.env.SERVER_PORT || serverConfig.port);
  logger.log(`Application listening on port ${process.env.SERVER_PORT || serverConfig.port}`);
}
bootstrap();