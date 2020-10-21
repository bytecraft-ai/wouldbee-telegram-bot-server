import { Controller, Post, Body, ValidationPipe, Get, UsePipes, Render, Param, Logger } from '@nestjs/common';
import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
import { CreateProfileDto, CreateUserDto, PartnerPreferenceDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';
import { User } from './entities/user.entity';

const logger = new Logger('ProfileController');

@Controller('user')
@UsePipes(ValidationPipe)
export class UserController {
    constructor(private readonly profileService: ProfileService) { }

    @Post('/')
    // @Render('index')
    async registerUser(@Body() registerInput: CreateUserDto): Promise<User> {
        logger.log('registerUser was hit with:', JSON.stringify(registerInput));
        const user = await this.profileService.createUser(registerInput);
        console.log('registered user:', user);
        return user;
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


    // @Post('/telegramauth')
    // @Render('index')
    // async telegramAuth(@Body() auth: TelegramAuthenticateDto) {
    //     console.log('register was hit with:', auth);
    //     const valid = this.profileService.checkTelegramAuth(auth);
    //     return { message: valid ? "Auth validated!" : "Invalid Auth" };
    // }


    // @Get('/msg')
    // @Render('index')
    // async sendMessage() {
    //     const sent = await this.profileService.sendMessage();
    //     return { message: `send msg: ${sent ? 'success' : 'failure'} ` }
    // }
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
