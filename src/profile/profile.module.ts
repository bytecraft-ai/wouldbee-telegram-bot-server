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
// import { User } from './entities/user.entity';
import { TelegramProfile } from './entities/telegram-profile.entity';
// import { SharedMatch } from './entities/shared-profiles.entity';
import { AwsServiceModule } from 'src/aws-service/aws-service.module';
import { PassportModule } from '@nestjs/passport';
import { BioData } from './entities/bio-data.entity';
import { IdProof } from './entities/id-proof.entity';
import { ProfilePicture } from './entities/picture.entity';
import { Document } from './entities/document.entity';
import { AgentModule } from 'src/agent/agent.module';
import { AuthModule } from 'src/auth/auth.module';
import { Match } from './entities/match.entity';
import { BullModule } from '@nestjs/bull';
import { TelegramModule } from 'src/telegram/telegram.module';
import { MatchQueueConsumer } from './profile-matchfinder.queue-consumer';
import { SendQueueConsumer } from './profile-sender.queue-consumer';
// import { AwsDocument } from './entities/aws-document.entity';
// import { InvalidDocument } from './entities/invalid-document.entity';

@Module({
    imports: [AuthModule, AgentModule,
        TypeOrmModule.forFeature([Caste, City, Country, PartnerPreference, Profile, State, TelegramProfile, ProfilePicture, BioData, IdProof, Document, Match]), AwsServiceModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        BullModule.registerQueue(
            { name: 'find-match' }, { name: 'send-profile' }
        ),
        forwardRef(() => TelegramModule)
    ],
    providers: [ProfileService, SendQueueConsumer, MatchQueueConsumer],
    controllers: [ProfileController, PreferenceController, CommonController, TelegramProfileController],
    exports: [ProfileService]
})
export class ProfileModule { }
