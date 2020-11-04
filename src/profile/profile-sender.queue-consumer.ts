import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProfileService } from './profile.service';

const logger = new Logger('SendQueueConsumer');

@Processor('find-match')
export class SendQueueConsumer {

    constructor(
        private readonly profileService: ProfileService,
    ) { }

    @Process()
    async sendMatches(job: Job<unknown>) {
        logger.log(`Starting ${job.data} at ${new Date()}`);
        await this.profileService.sendMatches();
        return {};
    }

}