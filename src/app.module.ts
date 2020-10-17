import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './config/typeorm-config';
import { ProfileModule } from './profile/profile.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppService } from './app.service';
require("dotenv").config();

console.log('typeorm config:', typeOrmConfig);
// console.log('bot token:', process.env.BOT_TOKEN);

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...typeOrmConfig, autoLoadEntities: true }),
    ProfileModule,
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN,
    })
  ],
  providers: [AppService],
  controllers: [AppController]
})
export class AppModule { }
