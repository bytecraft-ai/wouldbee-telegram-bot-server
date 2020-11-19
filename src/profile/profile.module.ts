import { forwardRef, Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CommonController, PreferenceController, ProfileController, TelegramProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
import { TelegramProfile } from './entities/telegram-profile.entity';
import { AwsServiceModule } from 'src/aws-service/aws-service.module';
import { PassportModule } from '@nestjs/passport';
import { Document } from './entities/document.entity';
import { AgentModule } from 'src/agent/agent.module';
import { AuthModule } from 'src/auth/auth.module';
import { Match } from './entities/match.entity';
import { BullModule } from '@nestjs/bull';
import { TelegramModule } from 'src/telegram/telegram.module';
import { SchedulerQueueConsumer } from './queue-consumers/scheduler-queue-consumer';
import { DeactivatedProfile } from './entities/deactivated-profile.entity';

@Module({
    imports: [AuthModule, AgentModule,
        TypeOrmModule.forFeature([Caste, City, Country, PartnerPreference, Profile, State, TelegramProfile, Document, Match, DeactivatedProfile]), AwsServiceModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        BullModule.registerQueue(
            { name: 'scheduler-queue' },
        ),
        forwardRef(() => TelegramModule)
    ],
    providers: [ProfileService, SchedulerQueueConsumer],
    controllers: [ProfileController, PreferenceController, CommonController, TelegramProfileController],
    exports: [ProfileService]
})
export class ProfileModule { }
