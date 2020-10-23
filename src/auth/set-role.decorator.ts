// import { SetMetadata } from '@nestjs/common';

// export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/common/enum";

export const Roles = (...roles: Array<UserRole>): ((target: object, key?: any, descriptor?: any) => any) =>
    SetMetadata("roles", [...roles]);