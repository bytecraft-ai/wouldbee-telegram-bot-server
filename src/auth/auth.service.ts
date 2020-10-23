import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AgentService } from 'src/agent/agent.service';
import { AgentSignInDto } from 'src/agent/dto/agent-register.dto';
import { Agent } from 'src/agent/entities/agent.entity';
import { JwtPayload } from 'src/common/interface';
import { JwtService } from '@nestjs/jwt';

const logger = new Logger('AuthService');

@Injectable()
export class AuthService {
    constructor(
        private readonly agentService: AgentService,
        private jwtService: JwtService
    ) { }


    async validate(payload: JwtPayload): Promise<Agent> {
        const { username: id } = payload;
        const agent = await this.agentService.getAgentById(id, {
            throwOnFail: false
        });

        if (!agent) {
            logger.log('Could not find agent with id:', id);
            return null;
        }

        // const updateThreshold = 50000; // 50 seconds
        // const lastSeenDiff = Date.now() - user.lastSeen.valueOf();
        // if (lastSeenDiff > updateThreshold) {
        //     await this.updateLastSeen(user);
        // }

        return agent;
    }


    async signInAgent(authInput: AgentSignInDto): Promise<{ accessToken: string } | undefined> {
        const agent = await this.agentService.validateAgent(authInput);
        if (!agent) {
            throw new UnauthorizedException('Invalid Credentials!');
        }

        const payload: JwtPayload = {
            username: agent.id
        }

        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    }
}
