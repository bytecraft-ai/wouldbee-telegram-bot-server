import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CommonController, PreferenceController, ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
// import { User } from './entities/user.entity';
import { TelegramProfile } from './entities/telegram-profile.entity';
import { SharedProfile } from './entities/shared-profiles.entity';
import { AwsServiceModule } from 'src/aws-service/aws-service.module';
import { PassportModule } from '@nestjs/passport';
import { BioData } from './entities/bio-data.entity';
import { IdProof } from './entities/id-proof.entity';
import { ProfilePicture } from './entities/picture.entity';
import { Document } from './entities/document.entity';
import { AgentModule } from 'src/agent/agent.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [AuthModule, AgentModule,
        TypeOrmModule.forFeature([Caste, City, Country, PartnerPreference, Profile, State, TelegramProfile, SharedProfile, ProfilePicture, BioData, IdProof, Document,]), AwsServiceModule, PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    providers: [ProfileService],
    controllers: [ProfileController, PreferenceController, CommonController],
    exports: [ProfileService]
})
export class ProfileModule { }
