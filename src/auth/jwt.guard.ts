import { Observable } from "rxjs";
import { ExecutionContext, Injectable, CanActivate, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { UserRole } from "src/common/enum";
import { RolesGuard } from "./role.guard";

const logger = new Logger('JwtGuard');

@Injectable()
export class JwtGuard extends AuthGuard("jwt") implements CanActivate {
    constructor(private readonly reflector: Reflector) {
        super();
    }


    getRequest(context: ExecutionContext): Request {
        return context.switchToHttp().getRequest();
    }


    public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // const isPublic = this.reflector.get<boolean>("isPublic", context.getHandler());
        // if (isPublic) {
        //     return true;
        // }

        const roles = this.reflector.get<UserRole[]>("roles", context.getHandler());

        if (!roles) {
            return true;
        }

        return super.canActivate(context);
    }
}
