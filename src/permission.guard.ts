import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const requirePermissions = this.reflector.getAllAndOverride<string[]>(
      'require-permissions',
      [context.getClass(), context.getHandler()],
    );
    const permission = request.user?.permissions;

    if (!permission?.length && requirePermissions?.length) {
      throw new UnauthorizedException('没有权限');
    }

    if (!requirePermissions) {
      return true;
    }

    for (let i = 0; i < requirePermissions.length; i++) {
      const currentPermission = requirePermissions[i];
      const hasPermission = permission.some(
        (item) => item.code === currentPermission,
      );

      if (!hasPermission) {
        throw new UnauthorizedException('没有权限');
      }
    }

    return true;
  }
}
