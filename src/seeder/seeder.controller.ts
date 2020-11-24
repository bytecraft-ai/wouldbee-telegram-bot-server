import { Body, Controller, Get, Logger } from '@nestjs/common';
import { Roles } from 'src/auth/set-role.decorator';
import { UserRole } from 'src/common/enum';
import { SeederService } from './seeder.service';

const logger = new Logger('SeederController');

@Controller('seed')
export class SeederController {
    constructor(
        private readonly seederService: SeederService,
    ) { }


    @Get('/location')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async seedLocation() {
        await this.seederService.seedLocation();
        return {
            "status": "OK"
        };
    }


    @Get('/caste')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async seedCastes() {
        await this.seederService.seedCastes();
        return {
            "status": "OK"
        };
    }

    // @Get('/agents')
    // async seedAgents() {
    //     try {
    //         await this.seederService.seedAgents();
    //     }
    //     catch (error) {
    //         logger.error(`Could not seed Agents. Error: ${error}`);
    //     }
    //     return {
    //         "status": "OK"
    //     };
    // }
}
