// import { Observable } from "rxjs";
// import { ExecutionContext, Injectable, CanActivate } from "@nestjs/common";
// import { GqlExecutionContext } from "@nestjs/graphql";
// import { Reflector } from "@nestjs/core";
// import { AuthGuard } from "@nestjs/passport";
// import { Request } from "express";

// @Injectable()
// export class GqlJwtGuard extends AuthGuard("jwt") implements CanActivate {
//     constructor(private readonly reflector: Reflector) {
//         super();
//     }


//     getRequest(context: ExecutionContext): Request {
//         // console.log('req:', GqlExecutionContext.create(context).getContext().req);
//         // console.log('httpReq:', context.switchToHttp().getRequest());
//         return GqlExecutionContext.create(context).getContext().req;
//     }


//     public canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
//         const isPublic = this.reflector.get<boolean>("isPublic", context.getHandler());
//         if (isPublic) {
//             return true;
//         }

//         // for now we don't need to specify public on every public api.
//         // const roles = this.reflector.get<string[]>("roles", context.getHandler());
//         // if (!roles) {
//         //     return true;
//         // }

//         return super.canActivate(context);
//     }
// }