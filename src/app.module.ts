import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './config/typeorm-config';
import { ProfileModule } from './profile/profile.module';
import { AppService } from './app.service';
import { AwsServiceModule } from './aws-service/aws-service.module';
import { TelegramModule } from './telegram/telegram.module';
import { MulterModule } from '@nestjs/platform-express';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
// import { DiskStorage } from 'multer';
// import { APP_GUARD } from '@nestjs/core';
// import { RolesGuard } from './auth/role.guard';

// console.log('typeorm config:', typeOrmConfig);
// console.log('bot token:', process.env.BOT_TOKEN);

@Module({
  imports: [
    MulterModule.register({
      // dest: '/tmp/wb-tg-uploads/',
      // storage: DiskStorage
    }),
    TypeOrmModule.forRoot({ ...typeOrmConfig, autoLoadEntities: true }),
    ProfileModule, AwsServiceModule,
    // TelegrafModule.forRoot({
    //   token: process.env.BOT_TOKEN,
    // }),
    TelegramModule,
    AgentModule,
    AuthModule,

  ],
  providers: [
    AppService,
  ],
  controllers: [AppController]
})
export class AppModule { }
