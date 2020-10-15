import { Controller, Post, Body, ValidationPipe, Get, UsePipes } from '@nestjs/common';
import { RegisterDto, UserDto } from './dto/telegram.dto';
import { TelegramService } from './telegram.service';

@Controller('telegram')
@UsePipes(ValidationPipe)
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) { }


    // @Post('/register')
    // async register(@Body() registerInput: RegisterDto) {
    //     console.log('register was hit with:', registerInput);
    //     return this.telegramService.register(registerInput);
    // }


    @Post('/register')
    async register(@Body() registerInput: UserDto) {
        console.log('register was hit with:', registerInput);
        return this.telegramService.createUser(registerInput);
    }
}
