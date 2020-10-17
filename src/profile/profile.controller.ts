import { Controller, Post, Body, ValidationPipe, Get, UsePipes, Render } from '@nestjs/common';
import { TelegramAuthenticateDto } from './dto/telegram-auth.dto';
import { RegisterDto, UserDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@Controller('telegram')
@UsePipes(ValidationPipe)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }


    // @Post('/register')
    // async register(@Body() registerInput: RegisterDto) {
    //     console.log('register was hit with:', registerInput);
    //     return this.profileService.register(registerInput);
    // }


    @Post('/register')
    @Render('index')
    async register(@Body() registerInput: UserDto) {
        console.log('register was hit with:', registerInput);
        const user = await this.profileService.createUser(registerInput);
        console.log('registered user:', user);
        return { message: `User with email id:${user.email} & phone no. ${user.phone} has been registered successfully` };
    }


    @Post('/telegramauth')
    @Render('index')
    async telegramAuth(@Body() auth: TelegramAuthenticateDto) {
        console.log('register was hit with:', auth);
        const valid = this.profileService.checkTelegramAuth(auth);
        return { message: valid ? "Auth validated!" : "Invalid Auth" };
    }


    @Get('/msg')
    @Render('index')
    async sendMessage() {
        const sent = await this.profileService.sendMessage();
        return { message: `send msg: ${sent ? 'success' : 'failure'} ` }
    }
}
