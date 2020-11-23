import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentRepository } from './repositories/agent.repository';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [
    LoggerModule.forRoot(),
    TypeOrmModule.forFeature([AgentRepository]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [AgentService],
  controllers: [AgentController],
  exports: [AgentService],
})

export class AgentModule { }
