import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProfileService } from './profile.service';

const logger = new Logger('MatchQueueConsumer');

@Processor('find-match')
export class MatchQueueConsumer {

    constructor(
        private readonly profileService: ProfileService,
    ) { }


    @Process('create')
    async findMatchesAndSave(job: Job<unknown>) {
        logger.log(`Running find matches and save. ${job.data}`);
        const matches = await this.profileService.getMatches(job.data['profileId']);
        await this.profileService.saveMatches(job['profileId'], matches.values);
        return {};
    }


    @Process('update')
    async updateMatchesAndSave(job: Job<unknown>) {
        logger.log(`Running update matches and save. ${job.data}`);
        const matches = await this.profileService.getMatches(job.data['profileId']);
        await this.profileService.updateMatches(job['profileId'], matches.values);
        return {};
    }

}