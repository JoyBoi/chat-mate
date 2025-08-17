import type { Request } from 'express';
import type { AuthUser } from '@chat-mate/types';

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
