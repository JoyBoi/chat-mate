import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface GuestTokenPayload {
  sub: string;
  type: 'guest';
  sessionId: string;
  iat: number;
  exp: number;
}

export interface GuestUser {
  id: string;
  type: 'guest';
  sessionId: string;
  displayName: string;
  createdAt: Date;
}

@Injectable()
export class GuestAuthService {
  private readonly GUEST_TOKEN_TTL = 60 * 60 * 2; // 2 hours
  private readonly guestSessions = new Map<string, GuestUser>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  createGuestToken(): { token: string; user: GuestUser } {
    const guestId = `guest_${uuidv4()}`;
    const sessionId = uuidv4();
    const displayName = this.generateGuestDisplayName();

    const user: GuestUser = {
      id: guestId,
      type: 'guest',
      sessionId,
      displayName,
      createdAt: new Date(),
    };

    // Store guest session in memory (in production, use Redis)
    this.guestSessions.set(guestId, user);

    const payload: Omit<GuestTokenPayload, 'iat' | 'exp'> = {
      sub: guestId,
      type: 'guest',
      sessionId,
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: this.GUEST_TOKEN_TTL,
    });

    // Clean up expired sessions periodically
    this.scheduleSessionCleanup(guestId);

    return { token, user };
  }

  validateGuestToken(payload: GuestTokenPayload): GuestUser | null {
    const user = this.guestSessions.get(payload.sub);

    if (!user || user.sessionId !== payload.sessionId) {
      return null;
    }

    return user;
  }

  getGuestUser(guestId: string): GuestUser | null {
    return this.guestSessions.get(guestId) || null;
  }

  revokeGuestSession(guestId: string): boolean {
    return this.guestSessions.delete(guestId);
  }

  private generateGuestDisplayName(): string {
    const adjectives = [
      'Anonymous',
      'Curious',
      'Friendly',
      'Clever',
      'Swift',
      'Bright',
      'Quick',
      'Smart',
      'Cool',
      'Nice',
    ];
    const nouns = [
      'Visitor',
      'Guest',
      'User',
      'Explorer',
      'Wanderer',
      'Traveler',
      'Observer',
      'Newcomer',
      'Friend',
      'Buddy',
    ];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);

    return `${adjective} ${noun} ${number}`;
  }

  private scheduleSessionCleanup(guestId: string): void {
    setTimeout(() => {
      this.guestSessions.delete(guestId);
    }, this.GUEST_TOKEN_TTL * 1000);
  }

  // Get all active guest sessions (for admin/debugging)
  getActiveGuestSessions(): GuestUser[] {
    return Array.from(this.guestSessions.values());
  }

  // Clean up expired sessions manually
  cleanupExpiredSessions(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [guestId, user] of this.guestSessions.entries()) {
      const sessionAge = now.getTime() - user.createdAt.getTime();
      if (sessionAge > this.GUEST_TOKEN_TTL * 1000) {
        this.guestSessions.delete(guestId);
        cleaned++;
      }
    }

    return cleaned;
  }
}
