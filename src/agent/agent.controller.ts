import {
    Body, Controller, Get, Logger, Post, Req, UseGuards,
    ValidationPipe
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentRegistrationDto, AgentSignInDto } from './dto/agent-register.dto';
import { Agent } from './entities/agent.entity';
import { GetUser } from '../auth/get-user.decorator'
import { Roles } from '../auth/set-role.decorator';
import { UserRole } from 'src/common/enum';
import { RolesGuard } from '../auth/role.guard';

const logger = new Logger('AgentController');

@Controller('agent')
@UseGuards(RolesGuard)
export class AgentController {
    constructor(
        private readonly agentService: AgentService
    ) { }


    @Post()
    async registerAgent(@Body() registrationDto: AgentRegistrationDto): Promise<Agent> {
        logger.log('controller:registerAgent - registrationDto:', JSON.stringify(registrationDto));
        return this.agentService.registerAgent(registrationDto);
    }


    @Get('/')
    async getAgents(): Promise<Agent[]> {
        return this.agentService.getAgents();
    }


    @Post('/test')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    test(
        // @Req() req,
        @GetUser() agent: Agent
    ) {
        // console.log('request:', req);
        console.log('agent:', agent);
        return { test: 'success' };
    }

}
