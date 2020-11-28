// import { BullModule } from '@nestjs/bull';
import { forwardRef, Logger, Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ProfileModule } from 'src/profile/profile.module';
import { TelegramService } from './telegram.service';
import { conditionalImports } from 'src/common/conditional-module-imports';


// const logger = new Logger('TelegramModule');
// logger.log(`Starting in ${process.env.NODE_ENV} environment`);
// logger.log(`BOT_TOKEN: ${process.env.BOT_TOKEN}`);
// logger.log(`DEV_BOT_TOKEN: ${process.env.DEV_BOT_TOKEN}`);
// logger.log(`STAGING_BOT_TOKEN: ${process.env.STAGING_BOT_TOKEN}`);



@Module({
  imports: [
    ...conditionalImports,
    TelegrafModule.forRoot({
      token: process.env.NODE_ENV === 'production'
        ? process.env.BOT_TOKEN
        : process.env.NODE_ENV === 'development'
          ? process.env.DEV_BOT_TOKEN
          : process.env.STAGING_BOT_TOKEN,
    }),
    // BullModule.registerQueue(
    //   { name: 'scheduler-queue' },
    // ),
    forwardRef(() => ProfileModule),
  ],
  providers: [TelegramService],
  exports: [TelegramService]
})
export class TelegramModule { }
