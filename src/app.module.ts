import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './config/typeorm-config';
import { TelegramModule } from './telegram/telegram.module';

console.log('typeorm config:', typeOrmConfig);

@Module({
  imports: [
    //   TypeOrmModule.forRoot({
    //   type: 'mongodb',
    //   url: 'mongodb://localhost/wouldbee',
    //   synchronize: true,
    //   useUnifiedTopology: true,
    //   entities: []
    // }),
    TypeOrmModule.forRoot({ ...typeOrmConfig, autoLoadEntities: true }),
    TelegramModule
  ],
  controllers: [AppController]
})
export class AppModule { }
