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


    @Process('reactivate-profiles')
    async batchReactivateProfiles(job: Job<unknown>) {
        logger.log(`processing activate-profile task at ${new Date()}`);
        await this.profileService.batchReactivateProfiles();
        return {};
    }


    @Process('delete-profiles')
    async batchDeleteProfiles(job: Job<unknown>) {
        logger.log(`processing activate-profile task at ${new Date()}`);
        await this.profileService.batchDeleteProfiles();
        return {};
    }


    @Process('create-profile')
    async findMatchesAndSave(job: Job<unknown>) {
        logger.log(`Running find matches and save. ${job.data}`);

        const profileId = job.data['profileId'];
        const matches = await this.profileService.findMatches(profileId);
        await this.profileService.saveMatches(profileId, matches.values);
        return {};
    }


    @Process('update-profile')
    async updateMatchesAndSave(job: Job<unknown>) {
        logger.log(`Running update matches and save. ${job.data}`);

        const profileId = job.data['profileId'];
        const matches = await this.profileService.findMatches(profileId);
        await this.profileService.updateMatches(profileId, matches.values);
        return {};
    }

}