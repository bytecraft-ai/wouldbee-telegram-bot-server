import { Body, Controller, Get } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Controller('seed')
export class SeederController {
    constructor(
        private readonly seederService: SeederService
    ) { }


    @Get('/location')
    async seedLocation() {
        await this.seederService.seedLocation();
        return {
            "status": "success"
        };
    }


    @Get('/caste')
    async seedCastes() {
        await this.seederService.seedCaste();
        return {
            "status": "success"
        };
    }
}
