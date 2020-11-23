import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ProfileModule } from 'src/profile/profile.module';
import { AgentModule } from 'src/agent/agent.module';
import { LoggerModule } from "nestjs-pino";


@Module({
  imports: [LoggerModule.forRoot(), AuthModule, ProfileModule, AgentModule],
  providers: [SeederService],
  controllers: [SeederController]
})
export class SeederModule { }
