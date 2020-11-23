import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { typeOrmConfig } from './config/typeorm-config';
import { ProfileModule } from './profile/profile.module';
import { AppService } from './app.service';
import { AwsServiceModule } from './aws-service/aws-service.module';
import { TelegramModule } from './telegram/telegram.module';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { SeederModule } from './seeder/seeder.module';
import { LoggerMiddleware } from './common/logger.middleware';

// import { MulterModule } from '@nestjs/platform-express';
// import { GraphQLModule } from '@nestjs/graphql';

// console.log('typeorm config:', typeOrmConfig);
// console.log('bot token:', process.env.BOT_TOKEN);

@Module({
  imports: [
    // GraphQLModule.forRoot({
    //   installSubscriptionHandlers: true,
    //   autoSchemaFile: true,

    //   //// use the below context once GQL guard is set up.
    //   // context: ({ req, connection }) => connection
    //   //   ? { req: { headers: connection.context } }
    //   //   : { req },

    //   playground: process.env.NODE_ENV === 'production' ? true : true
    // }),
    // MulterModule.register({
    //   // dest: '/tmp/wb-tg-uploads/',
    //   // storage: DiskStorage
    // }),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue(
      {
        name: 'find-match',
        // redis: {
        //   host: 'localhost',
        //   port: 6379,
        // },
      },
      {
        name: 'send-profile',
        // redis: {
        //   host: 'localhost',
        //   port: 6379,
        // },
      }
    ),
    TypeOrmModule.forRoot({ ...typeOrmConfig, autoLoadEntities: true }),
    TelegramModule,
    ProfileModule,
    AwsServiceModule,
    AgentModule,
    AuthModule,
    SeederModule,

  ],
  providers: [
    AppService,
  ],
  controllers: [AppController]
})

export class AppModule { }

// Use it to apply logging middleware to intercept requests.
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(LoggerMiddleware)
//       .forRoutes({ path: 'preference', method: RequestMethod.POST });
//   }
// }
