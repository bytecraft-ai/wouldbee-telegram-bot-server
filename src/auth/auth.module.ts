import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AgentModule } from 'src/agent/agent.module';
import { AuthController } from './auth.controller';
import { get } from 'config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './role.guard';
import { JwtGuard } from './jwt.guard';
const jwtConfig = get('jwt');

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || jwtConfig.secret,
      signOptions: {
        expiresIn: jwtConfig.expiresIn
      }
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AgentModule
  ],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtGuard,
    },
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }
