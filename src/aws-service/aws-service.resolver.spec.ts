import { Test, TestingModule } from '@nestjs/testing';
import { AwsServiceController } from './aws-service.controller';

describe('AwsServiceResolver', () => {
  let resolver: AwsServiceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AwsServiceController],
    }).compile();

    resolver = module.get<AwsServiceController>(AwsServiceController);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
