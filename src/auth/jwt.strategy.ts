import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { get } from 'config';
import { AuthService } from 'src/auth/auth.service';
import { JwtPayload } from '../common/interface';
import { WbAgent } from 'src/agent/entities/agent.entity';

const jwtConfig = get('jwt');

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || jwtConfig.secret,
        });
    }

    async validate(payload: JwtPayload): Promise<WbAgent | undefined> {
        const agent = await this.authService.validate(payload);
        if (!agent) throw new UnauthorizedException();

        return agent;
    }
}