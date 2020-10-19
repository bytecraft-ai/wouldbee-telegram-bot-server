import { Module } from '@nestjs/common';
import { AwsServiceController } from './aws-service.controller';
import { AwsService } from './aws-service.service';

@Module({
  providers: [AwsServiceController, AwsService],
  exports: [AwsService]
})
export class AwsServiceModule { }
