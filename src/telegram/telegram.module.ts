import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Caste } from './entities/caste.entity';
import { City } from './entities/city.entity';
import { Country } from './entities/country.entity';
import { PartnerPreference } from './entities/partner-preference.entity';
import { Profile } from './entities/profile.entity';
import { State } from './entities/state.entity';
import { User } from './entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Caste, City, Country, PartnerPreference, Profile, State, User])],
    providers: [TelegramService],
    controllers: [TelegramController]
})
export class TelegramModule { }
