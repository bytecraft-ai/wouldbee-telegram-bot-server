import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { WbAgent } from '../agent/entities/agent.entity';

export const GetAgent = createParamDecorator((data, ctx: ExecutionContext): WbAgent => {
    console.log('calling GetUser()');
    const req = ctx.switchToHttp().getRequest();
    return req.user;
});


