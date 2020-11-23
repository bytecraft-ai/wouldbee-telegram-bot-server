import { Module } from '@nestjs/common';
import { AwsServiceController } from './aws-service.controller';
import { AwsService } from './aws-service.service';
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [LoggerModule.forRoot()],
  providers: [AwsServiceController, AwsService],
  exports: [AwsService]
})
export class AwsServiceModule { }
