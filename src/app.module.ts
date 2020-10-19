import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './config/typeorm-config';
import { ProfileModule } from './profile/profile.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppService } from './app.service';
import { AwsServiceModule } from './aws-service/aws-service.module';
import { TelegramModule } from './telegram/telegram.module';

// console.log('typeorm config:', typeOrmConfig);
// console.log('bot token:', process.env.BOT_TOKEN);

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...typeOrmConfig, autoLoadEntities: true }),
    ProfileModule, AwsServiceModule,
    // TelegrafModule.forRoot({
    //   token: process.env.BOT_TOKEN,
    // }),
    TelegramModule
  ],
  providers: [AppService],
  controllers: [AppController]
})
export class AppModule { }
