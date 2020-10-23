import { Body, Controller, Post } from '@nestjs/common';
import { AgentSignInDto } from 'src/agent/dto/agent-register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }

    @Post('/signin')
    async signIn(@Body() authInput: AgentSignInDto): Promise<{ accessToken: string } | undefined> {
        return this.authService.signInAgent(authInput);
    }
}
