import { Controller, Post, Body, ValidationPipe, Get, UsePipes, Param, Logger, UseInterceptors, UploadedFiles, Query, DefaultValuePipe, ParseIntPipe, ParseArrayPipe } from '@nestjs/common';
import { CreateCasteDto, CreateProfileDto, CreateUserDto, FileUploadDto, PartnerPreferenceDto, RegistrationDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';
import { DocumentValidationDto, DocumentTypeDto, GetCitiesDto, GetCountriesDto, GetStatesDto, GetTelegramProfilesDto, PaginationDto, BanProfileDto } from './dto/location.dto';
import { TypeOfDocument, UserRole, UserStatOptions } from 'src/common/enum';
import { TelegramProfile } from './entities/telegram-profile.entity';
import { IList, IUserStats } from 'src/common/interface';
import { Roles } from 'src/auth/set-role.decorator';
import { GetAgent } from 'src/auth/get-agent.decorator';
import { WbAgent } from 'src/agent/entities/agent.entity';
// import { AwsService } from 'src/aws-service/aws-service.service';
// import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
// import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
// import { editFileName, imageOrDocFileFilter } from 'src/common/file-util';
// import { diskStorage } from 'multer';

const logger = new Logger('ProfileController');


@Controller('common')
// @UsePipes(ValidationPipe)
export class CommonController {
    constructor(
        private readonly profileService: ProfileService,
        // private readonly awsService: AwsService
    ) { }

    // @Get('/upload')      // meant for testing
    // async upload() {
    //     const link = await this.awsService.uploadFileToS3("1e904bf2-5b84-427d-b169-c57deccd9655", "1e904bf2-5b84-427d-b169-c57deccd9655_bio.pdf", "application/pdf", TypeOfDocument.BIO_DATA);
    //     return { link };
    // }

    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCommonData() {
        return this.profileService.getCommonData();
    }


    @Get('/caste')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getCastes(@Query() options: GetCitiesDto,) {
        return this.profileService.getCastesLike(options?.like, options?.skip, options?.take);
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
    constructor(private readonly profileService: ProfileService) { }

    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async userStats(@Query('userType') userType: UserStatOptions): Promise<IUserStats> {
        return this.profileService.userStats(userType);
    }
}


@Controller('telegram-profile')
@UsePipes(ValidationPipe)
export class TelegramProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('/test')
    test() {
        return {
            test: 'success'
        };
    }

    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getTelegramProfiles(@Query() options: GetTelegramProfilesDto): Promise<IList<TelegramProfile>> {
        console.log('get all telegram profiles');
        return this.profileService.getTelegramProfilesForVerification(
            options?.skip, options?.take
        );
    }


    @Get(':id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getTelegramProfile(@Param('id') id: string) {
        console.log('get profile with id', id);
        return {
            'profile': await this.profileService.getTelegramProfileById(id, { throwOnFail: true }),
            'bio': await this.profileService.getSignedDownloadUrl(id, 'bio-data', { throwOnFail: false }),
            'picture': await this.profileService.getSignedDownloadUrl(id, 'picture', { throwOnFail: false }),
        };
    }


    // TODO: implement caching on client side
    @Get('/url/:id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getSignedDownloadUrl(@Param('id') id: string, @Query() query: DocumentTypeDto): Promise<{ url: string }> {
        console.log('id:', id, 'docType:', query);
        return await this.profileService.getSignedDownloadUrl(id, query.documentType, { throwOnFail: true });
    }


    // @Post('/validate/:id')
    @Post('/validate')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async validateOrRejectDocument(
        @GetAgent() agent: WbAgent,
        // @Param('id') id: string,
        @Body() body: DocumentValidationDto) {
        // console.log('id:', id, 'body:', body);
        await this.profileService.validateDocument(body, agent);
        return { status: 'OK' };
    }


    @Post('/ban/:id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async banProfile(
        @GetAgent() agent: WbAgent,
        @Param('id') id: string,
        @Body() body: BanProfileDto) {
        console.log('id:', id, 'body:', body);
        await this.profileService.banProfile(id, body, agent);
        return { status: 'OK' };
    }
}


@Controller('profile')
@UsePipes(ValidationPipe)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getProfiles() {
        console.log('get all profiles');
        return this.profileService.getProfiles();
    }


    @Get(':id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getProfile(@Param('id') id: string) {
        console.log('get profile with id', id);
        return this.profileService.getProfile(id, { throwOnFail: true });
    }


    @Post('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async createProfile(@Body() createProfileDto: CreateProfileDto) {
        console.log('create profile with', createProfileDto);
        return this.profileService.saveProfile(createProfileDto);
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


    @Get(':id')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async getPreference(@Param('id') id: string) {
        console.log('get preference with id', id);
        return this.profileService.getPreference(id, { throwOnFail: true });
    }


    @Post('/')
    @Roles(UserRole.AGENT, UserRole.ADMIN)
    async setPreference(@Body() preference: PartnerPreferenceDto) {
        console.log('set preference to', preference);
        return this.profileService.savePartnerPreference(preference);
    }
}


@Controller('file')
@UsePipes(ValidationPipe)
export class FileController {
    constructor(private readonly profileService: ProfileService) { }


    @Post('/')
    async updateFile(@Body() fileUploadDto: FileUploadDto) {

    }


    @Get('/uploadlink')
    async getUploadLink(@Body() fileUploadDto: FileUploadDto) {

    }
}
