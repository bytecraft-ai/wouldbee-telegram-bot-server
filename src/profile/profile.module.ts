import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { PreferenceController, ProfileController, UserController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
import { User } from './entities/user.entity';
import { TelegramProfile } from './entities/telegram-profile.entity';
import { SharedProfile } from './entities/shared-profiles.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Caste, City, Country, PartnerPreference, Profile, State, User, TelegramProfile, SharedProfile])],
    providers: [ProfileService],
    controllers: [ProfileController, UserController, PreferenceController],
    exports: [ProfileService]
})
export class ProfileModule { }
