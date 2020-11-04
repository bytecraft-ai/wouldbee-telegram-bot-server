import {
    Body, Controller, Get, Logger, Post, Req, UseGuards,
    ValidationPipe
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { AgentRegistrationDto, AgentSignInDto } from './dto/agent-register.dto';
import { Agent } from './entities/agent.entity';
import { GetAgent } from '../auth/get-agent.decorator'
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


    // @Post()
    // async registerAgent(@Body() registrationDto: AgentRegistrationDto): Promise<Agent> {
    //     logger.log('controller:registerAgent - registrationDto:', JSON.stringify(registrationDto));
    //     return this.agentService.registerAgent(registrationDto);
    // }


    @Get('/')
    async getAgents(): Promise<Agent[]> {
        return this.agentService.getAgents();
    }


    @Post('/test')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    test(
        // @Req() req,
        @GetAgent() agent: Agent
    ) {
        // console.log('request:', req);
        console.log('agent:', agent);
        return { test: 'success' };
    }


    @Get('/init')
    async init() {
        const rahul: AgentRegistrationDto = {
            email: "rahul@wouldbee.com",
            phone: "9611121073",
            name: "Rahul Gupta",
            password: "Password-1",
            role: UserRole.ADMIN
        }
        const charul: AgentRegistrationDto = {
            email: "charul@wouldbee.com",
            phone: "97030726206",
            name: "Kritika Agrawal",
            password: "Password-1",
            role: UserRole.AGENT
        }

        try {
            await this.agentService.registerAgent(rahul);
        } catch (err) {
            logger.log(`Could not init Admin: rahul. Error: ${err}`);
        }

        try {
            await this.agentService.registerAgent(charul);
        } catch (err) {
            logger.log(`Could not init Agent: charul. Error: ${err}`);
        }

        return {
            message: 'initialized admins and agents'
        };
    }

}
