import {
    Body, Controller, Get, Logger, Post, Req, UseGuards,
    ValidationPipe
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { RolesGuard } from '../auth/role.guard';
// import { AgentRegistrationDto, AgentSignInDto } from './dto/agent-register.dto';
// import { WbAgent } from './entities/agent.entity';
// import { GetAgent } from '../auth/get-agent.decorator'
// import { Roles } from '../auth/set-role.decorator';
// import { UserRole } from 'src/common/enum';

const logger = new Logger('AgentController');

@Controller('agent')
@UseGuards(RolesGuard)
export class AgentController {
    constructor(
        private readonly agentService: AgentService
    ) { }


    // @Post()
    // async registerAgent(@Body() registrationDto: AgentRegistrationDto): Promise<Agent> {
    //     logger.log('controller:registerAgent - registrationDto:', JSON.stringify(registrationDto));
    //     return this.agentService.registerAgent(registrationDto);
    // }


    // @Get('/')
    // @Roles(UserRole.ADMIN)
    // async getAgents(): Promise<WbAgent[]> {
    //     return this.agentService.getAgents();
    // }


    // @Post('/test')
    // @Roles(UserRole.AGENT, UserRole.ADMIN)
    // test(
    //     // @Req() req,
    //     @GetAgent() agent: WbAgent
    // ) {
    //     console.log('agent:', agent);
    //     return { test: 'success' };
    // }

}
