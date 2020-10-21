import { Controller, Post, Body, ValidationPipe, Get, UsePipes, Render, Param, Logger, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
import { CreateProfileDto, CreateUserDto, FileUploadDto, PartnerPreferenceDto, RegistrationDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';
import { User } from './entities/user.entity';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { GetCitiesDto, GetCountriesDto, GetStatesDto } from './dto/location.dto';

const logger = new Logger('ProfileController');


@Controller('common')
@UsePipes(ValidationPipe)
export class CommonController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('/')
    async getCommonData() {
        return this.profileService.getCommonData();
    }


    @Get('/seed')
    async seed() {
        await this.profileService.seedCaste();
        return this.getCastes();
    }


    @Get('/caste')
    async getCastes() {
        return this.profileService.getCastes();
    }


    @Get('/caste/:id')
    async getCaste(@Param('id') id: number) {
        return this.profileService.getCaste(id, true);
    }


    @Get('/city')
    async getCities(@Body() getCitiesDto: GetCitiesDto) {
        return this.profileService.getCities();
    }


    @Get('/city/:id')
    async getCity(@Param('id') id: number) {
        return this.profileService.getCity(id, { throwOnFail: true });
    }


    @Get('/state')
    async getStates(@Body() getStatesDto: GetStatesDto) {
        return this.profileService.getCastes();
    }


    @Get('/state/:id')
    async getState(@Param('id') id: number) {
        return this.profileService.getCaste(id, true);
    }


    @Get('/country')
    async getCountries(@Body() getCountriesDto: GetCountriesDto) {
        return this.profileService.getCountriesLike(getCountriesDto?.like, getCountriesDto?.skip, getCountriesDto?.take);

    }


    @Get('/country/:id')
    async getCountry(@Param('id') id: number) {
        return this.profileService.getCountry(id, true);
    }

}


@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
    constructor(private readonly profileService: ProfileService) { }

    @Post('/')
    // @Render('index')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'bioData', maxCount: 1 },
        { name: 'idProof', maxCount: 1 },
    ]))
    async createUser(@Body() registerInput: CreateUserDto,
        @UploadedFiles() files): Promise<User> {
        logger.log('registerUser was hit with:', JSON.stringify(registerInput));
        console.log('files:', files);
        const user = await this.profileService.createUser(registerInput);
        console.log('registered user:', user);
        return user;
    }


    @Post('/register')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'bioData', maxCount: 1 },
        { name: 'idProof', maxCount: 1 },
    ]))
    async register(@Body() registrationDto: RegistrationDto, @UploadedFiles() files) {
        console.log(files);
        const user = await this.profileService.register(registrationDto);
    }




    @Get('/')
    async getUsers() {
        console.log('get all users');
        return this.profileService.getUsers();
    }


    @Get('/find:phone')
    async findUser(@Param('phone') phone: string) {
        console.log('get user with phone', phone);
        return this.profileService.getUserByPhone(phone);
    }


    @Get(':id')
    async getUser(@Param('id') id: string) {
        console.log('get user with id', id);
        return this.profileService.getUser(id);
    }

}


@Controller('profile')
@UsePipes(ValidationPipe)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('/')
    async getProfiles() {
        console.log('get all profiles');
        return this.profileService.getProfiles();
    }


    @Get(':id')
    async getProfile(@Param('id') id: string) {
        console.log('get profile with id', id);
        return this.profileService.getProfile(id);
    }


    @Post('/')
    async createProfile(@Body() createProfileDto: CreateProfileDto) {
        console.log('create profile with', createProfileDto);
        return this.profileService.createProfile(createProfileDto);
    }
}



@Controller('preference')
@UsePipes(ValidationPipe)
export class PreferenceController {
    constructor(private readonly profileService: ProfileService) { }

    @Get('/')
    async getPreferences() {
        console.log('get preferences');
        return this.profileService.getPreferences();
    }


    @Get(':id')
    async getPreference(@Param('id') id: string) {
        console.log('get preference with id', id);
        return this.profileService.getPreference(id);
    }


    @Post('/')
    async setPreference(@Body() userPreference: PartnerPreferenceDto) {
        console.log('set preference to', userPreference);
        return this.profileService.savePartnerPreference(userPreference);
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
