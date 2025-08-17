/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthInfo {
  message?: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    this.logger.log(`Auth attempt for ${request.method} ${request.url}`);
    this.logger.debug(`Authorization header present: ${!!authHeader}`);

    if (authHeader) {
      this.logger.debug(
        `Auth header format: ${authHeader.substring(0, 20)}...`
      );
    }

    return super.canActivate(context);
  }

  handleRequest<TUser extends AuthUser = AuthUser>(
    err: Error | null,
    user: TUser | null,
    info: AuthInfo | null
  ): TUser {
    if (err) {
      this.logger.error(`Auth error: ${err.message || err}`);
    }

    if (info) {
      this.logger.debug(`Auth info: ${JSON.stringify(info)}`);
    }

    // If there's an error or no user, throw UnauthorizedException
    if (err || !user) {
      const message = info?.message || 'Authentication required';
      this.logger.warn(`Auth failed: ${message}`);
      throw new UnauthorizedException(message);
    }

    this.logger.log(`Auth successful for user: ${user.id}`);
    return user;
  }
}
