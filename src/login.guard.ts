import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Permission } from './user/entities/permission.entity';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UnLoginException } from './unlogin.filter';

export interface JwtUserData {
  id: number;
  username: string;
  roles: string[];
  permissions: Permission[];
}
declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}

@Injectable()
export class LoginGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;
  @Inject()
  private jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);

    if (!requireLogin) {
      return true;
    }

    const authorization = request.headers.authorization;

    if (!authorization) {
      // throw new UnauthorizedException('用户未登录');
      throw new UnLoginException();
    }

    try {
      const token = authorization.split(' ')[1];
      const user = this.jwtService.verify<JwtUserData>(token);

      request.user = user;
    } catch (e) {
      // throw new UnauthorizedException('token 失效，请重新登录');
      throw new UnLoginException('token 失效，请重新登录');
    }

    return true;
  }
}
