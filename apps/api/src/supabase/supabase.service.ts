import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY'
    );

    this.logger.log('Initializing Supabase service');
    this.logger.debug(`Supabase URL: ${supabaseUrl}`);
    this.logger.debug(`Service key present: ${!!supabaseKey}`);

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error('Supabase URL and Service Role Key must be provided');
      throw new Error('Supabase URL and Service Role Key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase client initialized successfully');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async verifyJWT(token: string) {
    this.logger.log('Attempting JWT verification with Supabase');
    this.logger.debug(`Token length: ${token.length}`);

    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        this.logger.error(`JWT verification failed: ${error.message}`);
        throw new Error(`JWT verification failed: ${error.message}`);
      }

      this.logger.log(`JWT verification successful for user: ${data.user?.id}`);
      this.logger.debug(`User email: ${data.user?.email}`);

      return data.user;
    } catch (error) {
      this.logger.error(
        `JWT verification exception: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
}
