import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any): any {
    // If there's an error or no user, throw UnauthorizedException
    if (err || !user) {
      const message =
        info && typeof info === 'object' && 'message' in info
          ? (info as { message: string }).message
          : 'Authentication required';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
