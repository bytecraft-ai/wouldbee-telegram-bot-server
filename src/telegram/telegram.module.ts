import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.NODE_ENV === 'production'
        ? process.env.BOT_TOKEN
        : process.env.NODE_ENV === 'development'
          ? process.env.DEV_BOT_TOKEN
          : process.env.STAGING_BOT_TOKEN,
    }),
  ],
  providers: [TelegramService]
})
export class TelegramModule { }
