import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ProfileService } from './profile.service';

const logger = new Logger('SendQueueConsumer');

@Processor('send-profile')
export class SendQueueConsumer {

    constructor(
        private readonly profileService: ProfileService,
    ) { }

    @Process()
    async sendMatches(job: Job<unknown>) {
        logger.log(`processing send-profile task ${JSON.stringify(job.data)}`);
        logger.log(`Starting ${job.data['task']} at ${new Date()}`);
        await this.profileService.sendMatches();
        return {};
    }

}