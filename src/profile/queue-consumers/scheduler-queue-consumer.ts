import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProfileService } from '../profile.service';

const logger = new Logger('SchedulerQueueConsumer');

@Processor('scheduler-queue')
export class SchedulerQueueConsumer {

    constructor(
        private readonly profileService: ProfileService,
    ) { }


    @Process('send-profiles')
    async sendMatches(job: Job<unknown>) {
        logger.log(`processing send-profiles task ${JSON.stringify(job.data)}`);
        logger.log(`Starting ${job.data['task']} at ${new Date()}`);
        await this.profileService.sendMatches();
        return {};
    }


    @Process('activate-profiles')
    async activateProfile(job: Job<unknown>) {
        logger.log(`processing activate-profile task at ${new Date()}`);
        await this.profileService.activateProfiles();
        return {};
    }


    @Process('create-profile')
    async findMatchesAndSave(job: Job<unknown>) {
        logger.log(`Running find matches and save. ${job.data}`);
        const matches = await this.profileService.getMatches(job.data['profileId']);
        await this.profileService.saveMatches(job['profileId'], matches.values);
        return {};
    }


    @Process('update-profile')
    async updateMatchesAndSave(job: Job<unknown>) {
        logger.log(`Running update matches and save. ${job.data}`);
        const matches = await this.profileService.getMatches(job.data['profileId']);
        await this.profileService.updateMatches(job['profileId'], matches.values);
        return {};
    }

}