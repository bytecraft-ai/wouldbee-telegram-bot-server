import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        console.log('calling canActivate!');
        const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        // console.log('user:', user);
        return this.matchRoles(roles, user.role);
    }

    matchRoles(roles: UserRole[], userRole: UserRole): boolean {
        // console.log('-- matching roles:')
        return roles.some(role => !!roles.find(role => role === userRole));
    }
}