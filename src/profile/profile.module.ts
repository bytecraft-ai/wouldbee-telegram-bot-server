import { forwardRef, Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CommonController, MatchController, PreferenceController, ProfileController, StatsController, TelegramAccountController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
import { TelegramAccount } from './entities/telegram-account.entity';
import { AwsServiceModule } from 'src/aws-service/aws-service.module';
import { PassportModule } from '@nestjs/passport';
import { Document } from './entities/document.entity';
import { AgentModule } from 'src/agent/agent.module';
import { AuthModule } from 'src/auth/auth.module';
import { Match } from './entities/match.entity';
import { BullModule } from '@nestjs/bull';
import { TelegramModule } from 'src/telegram/telegram.module';
import { TaskQueueConsumer } from './queue-consumers/task-queue-consumer';
import { Support } from './entities/support.entity';
import { DeactivatedProfile } from './entities/deactivated-profile.entity';
import { ProfileMarkedForDeletion } from './entities/to-delete-profile.entity';
import { conditionalImports } from 'src/common/conditional-module-imports';

@Module({
    imports: [
        ...conditionalImports,
        AuthModule, AgentModule,
        TypeOrmModule.forFeature([Caste, City, Country, PartnerPreference, Profile, State, TelegramAccount, Document, Match, Support, DeactivatedProfile, ProfileMarkedForDeletion]), AwsServiceModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        BullModule.registerQueue(
            { name: 'task-queue' },
        ),
        forwardRef(() => TelegramModule)
    ],
    providers: [ProfileService, TaskQueueConsumer],
    controllers: [ProfileController, PreferenceController, CommonController, TelegramAccountController, StatsController, MatchController],
    exports: [ProfileService]
})
export class ProfileModule { }
