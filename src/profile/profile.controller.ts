import { Controller, Post, Body, ValidationPipe, Get, UsePipes, Param, Logger, Query, DefaultValuePipe, ParseArrayPipe, ParseUUIDPipe, Req, ParseBoolPipe } from '@nestjs/common';
import { CreateCasteDto, CreateProfileDto, GetCastesDto, GetMatchesDto, GetProfileDto, GetTelegramAccountDto, GetProfilesDto, PartnerPreferenceDto, PatternPaginationDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';
import { DocumentValidationDto, GetTelegramAccountsDto, BanProfileDto } from './dto/profile.dto';
import { GetCitiesDto, GetCountriesDto, GetStatesDto } from './dto/location.dto';
import { UserRole } from 'src/common/enum';
import { TelegramAccount } from './entities/telegram-account.entity';
import { IList } from 'src/common/interface';
import { Roles } from 'src/auth/set-role.decorator';
import { GetAgent } from 'src/auth/get-agent.decorator';
import { WbAgent } from 'src/agent/entities/agent.entity';
import { Profile } from './entities/profile.entity';
import { TelegramService } from 'src/telegram/telegram.service';
import { Match } from './entities/match.entity';
import { agent } from 'supertest';
// import { Profile } from './entities/profile.entity';
// import { AwsService } from 'src/aws-service/aws-service.service';
// import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
// import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
// import { editFileName, imageOrDocFileFilter } from 'src/common/file-util';
// import { diskStorage } from 'multer';

const logger = new Logger('ProfileController');


@Controller('common')
export class CommonController {
    constructor(
        private readonly profileService: ProfileService
    ) { }


    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCommonData() {
        return this.profileService.getCommonData();
    }


    @Get('/caste')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCastes(@Query() options: GetCastesDto,) {
        return this.profileService.getCastesLike(options?.like, options?.religion, options?.skip, options?.take);
    }


    @Post('/caste')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async createCaste(@Body() createCasteDto: CreateCasteDto) {
        return this.profileService.createCaste(createCasteDto);
    }


    @Get('/caste/:id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCaste(@Param('id') id: number) {
        return this.profileService.getCaste(id, true);
    }


    @Get('/city')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCities(
        @Query() getCitiesDto: GetCitiesDto,
        @Query('stateIds', new DefaultValuePipe([]), new ParseArrayPipe({ items: Number, separator: ',' }))
        stateIds: number[],
        @Query('countryIds', new DefaultValuePipe([]), new ParseArrayPipe({ items: Number, separator: ',' }))
        countryIds: number[],
    ) {
        return this.profileService.getCitiesLike(getCitiesDto?.like, {
            countryIds: countryIds,
            stateIds: stateIds,
            take: getCitiesDto?.take,
            skip: getCitiesDto?.skip
        });
    }


    @Get('/city/:id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCity(@Param('id') id: number) {
        return this.profileService.getCity(id, { throwOnFail: true });
    }


    @Get('/state')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getStates(
        @Query() getStatesDto: GetStatesDto,
        @Query('countryIds', new DefaultValuePipe([]), new ParseArrayPipe({ items: Number, separator: ',' }))
        countryIds: number[],
    ) {
        console.log('countryIds:', countryIds);
        return this.profileService.getStatesLike(getStatesDto?.like, countryIds, getStatesDto?.skip, getStatesDto?.take);
    }


    @Get('/state/:id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getState(@Param('id') id: number) {
        return this.profileService.getState(id, { throwOnFail: true });
    }


    @Get('/country')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCountries(@Query() getCountriesDto: GetCountriesDto) {
        logger.log('getCountries()', JSON.stringify(getCountriesDto));
        return this.profileService.getCountriesLike(getCountriesDto?.like, getCountriesDto?.skip, getCountriesDto?.take);

    }


    @Get('/country/:id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCountry(@Param('id') id: number) {
        return this.profileService.getCountry(id, true);
    }

}


@Controller('stats')
@UsePipes(ValidationPipe)
export class StatsController {
    constructor(
        private readonly profileService: ProfileService,
        private readonly telegramService: TelegramService,
    ) { }


    @Get('/turn-on-notifications')
    // @Roles(UserRole.ADMIN)
    async turnAdminNotificationsOn() {
        this.telegramService.setAdminNotifications(true);
        return { notifications: 'on' };
    }


    @Get('/turn-off-notifications')
    // @Roles(UserRole.ADMIN)
    async turnAdminNotificationsOff() {
        this.telegramService.setAdminNotifications(false);
        return { notifications: 'off' };
    }


    @Get('/hard-delete-account-test/:uuid')
    // @Roles(UserRole.ADMIN)
    async hardDeleteAccount(
        // @GetAgent() agent: WbAgent,
        @Param('uuid', new ParseUUIDPipe()) uuid: string,
    ) {
        try {
            await this.profileService.hardDeleteProfileForTesting(uuid);
            return { status: 'OK' };
        } catch (error) {
            return { status: 'failed' };
        }
    }


    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async userStats() {
        return this.profileService.userStats();
    }

}


// @Controller('telegram-account')
@Controller('telegram-profile')
@UsePipes(ValidationPipe)
export class TelegramAccountController {
    constructor(private readonly profileService: ProfileService) { }

    // @Get('/test')
    // test() {
    //     return {
    //         test: 'success'
    //     };
    // }


    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getTelegramAccounts(@Query() options: GetTelegramAccountsDto): Promise<IList<TelegramAccount>> {
        logger.log('getTelegramAccounts');
        // return this.profileService.getTelegramAccountsForVerification(
        //     options?.skip, options?.take
        // );
        return this.profileService.getTelegramAccounts(options);
    }


    @Get('/search/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async searchTelegramAccount(
        @Query() options: PatternPaginationDto
    ): Promise<IList<TelegramAccount>> {
        return this.profileService.searchTelegramAccounts(options);
    }


    @Get(':uuid')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getTelegramAccount(
        @Param('uuid', new ParseUUIDPipe()) uuid: string,
        @Query() options: GetTelegramAccountDto
    ): Promise<TelegramAccount> {
        const relations = [];

        if (options.getProfile)
            relations.push('profile');
        // if (options.getPreference)
        //     relations.push('profile.partnerPreference');

        console.log('get telegramAccount with id', uuid,
            'options:', options, 'relations:', relations);

        return this.profileService.getTelegramAccountById(uuid, {
            throwOnFail: true,
            relations
        });
    }


    // TODO: implement caching on client side
    @Get('/url/:uuid')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getSignedDownloadUrl(@Param('uuid', new ParseUUIDPipe()) uuid: string): Promise<{ url: string }> {
        console.log('id:', uuid, 'type:', typeof uuid);
        return await this.profileService.getSignedDownloadUrl(uuid);
    }


    @Post('/validate')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async validateOrRejectDocument(
        @GetAgent() agent: WbAgent,
        @Body() body: DocumentValidationDto) {
        await this.profileService.validateDocument(body, agent);
        return { status: 'OK' };
    }


    @Post('/ban/:uuid')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async banProfile(
        @GetAgent() agent: WbAgent,
        @Param('uuid', new ParseUUIDPipe()) uuid: string,
        @Body() body: BanProfileDto) {
        console.log('uuid:', uuid, 'body:', body);
        await this.profileService.banProfile(uuid, body, agent);
        return { status: 'OK' };
    }
}


@Controller('profile')
@UsePipes(ValidationPipe)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getProfiles(@Query() options: GetProfilesDto): Promise<IList<Profile> | undefined> {
        return this.profileService.getProfiles(options);
    }


    @Get(':uuid')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getProfile(
        @Param('uuid', new ParseUUIDPipe()) uuid: string,
        @Query() options: GetProfileDto
    ): Promise<Profile | undefined> {
        const relations = ['city', 'caste'];
        if (options.getPreference)
            relations.push('partnerPreference')

        console.log('get profile with id', uuid, 'options:', options,
            'relations:', relations);

        return this.profileService.getProfileById(uuid, {
            throwOnFail: true,
            relations
        });
    }


    @Post('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async createProfile(@Body() createProfileDto: CreateProfileDto): Promise<Profile | undefined> {
        console.log('create profile with', createProfileDto);
        return this.profileService.saveProfile(createProfileDto);
    }

}


@Controller('matches')
@UsePipes(ValidationPipe)
export class MatchController {

    constructor(private readonly profileService: ProfileService) { }

    @Get('/find/:uuid')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async findMatches(
        @Param('uuid', new ParseUUIDPipe()) uuid: string,
        @Query() options: GetMatchesDto
    ): Promise<IList<Profile>> {
        logger.log(`getMatches(${uuid}, ${options?.skip}, ${options?.take})`);
        return this.profileService.findMatches(uuid, options?.skip, options?.take);
    }


    @Get('/send')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async sendMatches() {
        logger.log(`-> sendMatches()`);
        try {
            await this.profileService.sendMatches();
            return { status: "OK" };
        } catch (error) {
            logger.error(error);
            return { status: "failed" };
        }
    }


    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getAllMatches(
        @Query() options: GetMatchesDto
    ): Promise<IList<Match>> {
        logger.log(`getAllMatches(${JSON.stringify(options)})`);
        return this.profileService.getAllMatches(options);
    }


    @Get('/:uuid')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getMatches(
        @Param('uuid', new ParseUUIDPipe()) uuid: string,
        @Query() options: GetMatchesDto
    ): Promise<IList<Match>> {
        logger.log(`getMatches(${uuid}, ${JSON.stringify(options)})`);
        return this.profileService.getMatches(uuid, options);
    }
}


@Controller('preference')
@UsePipes(ValidationPipe)
export class PreferenceController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getPreferences() {
        console.log('get preferences');
        return this.profileService.getPreferences();
    }


    @Get(':uuid')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getPreference(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
        console.log('get preference with id', uuid);
        return this.profileService.getPreferenceById(uuid, { throwOnFail: true });
    }


    @Post('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async setPreference(
        @Req() req,
        @Body() preference: PartnerPreferenceDto
    ) {
        // console.log('set preference to', preference, req);
        return this.profileService.savePartnerPreference(preference);
    }
}
