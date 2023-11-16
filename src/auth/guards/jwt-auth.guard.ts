import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { META_ROLES } from '../decorators/role-protected.decorator';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const validRolesString: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    const req = context.switchToHttp().getRequest();

    const usuario: User = req.user;
    if (!usuario) throw new UnauthorizedException();

    if (!usuario.verified)
      throw new UnauthorizedException(
        `Usuario no verificado. Confirma tu email.`,
      );

    if (!validRolesString || validRolesString.length === 0) return true;

    throw new ForbiddenException(`User ${usuario.name} needs a valid role`);
  }
}
