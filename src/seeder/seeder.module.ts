import { Module } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { SeederController } from './seeder.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [AuthModule, ProfileModule],
  providers: [SeederService],
  controllers: [SeederController]
})
export class SeederModule { }
