import { Process, Processor } from '@nestjs/bull';
import { Logger, NotImplementedException } from '@nestjs/common';
import { Job } from 'bull';
import { ProfileService } from '../profile.service';
import { cleanTempDirectories } from 'src/common/file-util';

const logger = new Logger('SchedulerQueueConsumer');

@Processor('scheduler-queue')
export class SchedulerQueueConsumer {

    constructor(
        private readonly profileService: ProfileService,
    ) { }


    @Process('send-profiles')
    async sendMatches(job: Job<unknown>) {
        logger.log(`processing send-profiles task.`);
        await this.profileService.sendMatches();
        return {};
    }


    @Process('reactivate-profiles')
    async batchReactivateProfiles(job: Job<unknown>) {
        logger.log(`processing reactivate-profiles task.`);
        await this.profileService.batchReactivateProfiles();
        return {};
    }


    // TODO: Implement
    @Process('notify-reactivated-profiles')
    async notifyBatchReactivatedProfiles(job: Job<unknown>) {
        logger.log(`processing notify-reactivated-profiles task.`);
        throw new NotImplementedException();
        // return {};
    }


    @Process('delete-profiles')
    async batchDeleteProfiles(job: Job<unknown>) {
        logger.log(`processing delete-profiles task.`);
        await this.profileService.batchDeleteProfiles();
        return {};
    }


    // TODO: Implement
    @Process('notify-deleted-profiles')
    async notifyBatchDeletedProfiles(job: Job<unknown>) {
        logger.log(`processing notify-deleted-profiles task.`);
        throw new NotImplementedException();
        // return {};
    }


    @Process('create-profile')
    async findMatchesAndSave(job: Job<unknown>) {
        logger.log(`processing create-profile task. ${job.data}`);

        const profileId = job.data['profileId'];
        const matches = await this.profileService.findMatches(profileId);
        await this.profileService.saveMatches(profileId, matches.values);
        return {};
    }


    @Process('update-profile')
    async updateMatchesAndSave(job: Job<unknown>) {
        logger.log(`processing update-profile task. ${job.data}`);

        const profileId = job.data['profileId'];
        const matches = await this.profileService.findMatches(profileId);
        await this.profileService.updateMatches(profileId, matches.values);
        return {};
    }


    @Process('clean-temp-directories')
    async cleanTempDirectoriesTask(job: Job<unknown>) {
        logger.log(`Running clean-temp-directories task.`);
        await cleanTempDirectories();
        return;
    }

}