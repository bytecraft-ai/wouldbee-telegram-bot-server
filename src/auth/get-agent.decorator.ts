import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Agent } from '../agent/entities/agent.entity';

export const GetAgent = createParamDecorator((data, ctx: ExecutionContext): Agent => {
    console.log('calling GetUser()');
    const req = ctx.switchToHttp().getRequest();
    return req.user;
});


