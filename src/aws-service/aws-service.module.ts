import { Module } from '@nestjs/common';
import { AwsServiceController } from './aws-service.controller';
import { AwsService } from './aws-service.service';
import { conditionalImports } from 'src/common/conditional-module-imports';

@Module({
  imports: [...conditionalImports],
  providers: [AwsServiceController, AwsService],
  exports: [AwsService]
})
export class AwsServiceModule { }
