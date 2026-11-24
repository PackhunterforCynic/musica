import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { appConfig } from '../config/app';
import { UserProfile, AppError } from '@musica/shared';
import { loggerService } from './LoggerService';

export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const url = appConfig.supabase.url;
    const key = appConfig.supabase.secretKey || appConfig.supabase.publishableKey;

    if (url && key) {
      try {
        this.client = createClient(url, key, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });
        this.isConfigured = true;
        console.log(`[SupabaseService] Initialized client for ${url}`);
      } catch (err: any) {
        console.warn(`[SupabaseService] Initialization warning:`, err.message);
      }
    } else {
      console.log(`[SupabaseService] Running in guest/standalone mode (no Supabase keys set).`);
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public isEnabled(): boolean {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Validates a Supabase JWT and returns the authenticated user
   */
  public async verifyToken(token: string): Promise<User | null> {
    if (!this.client || !token) return null;

    try {
      const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
      const { data, error } = await this.client.auth.getUser(cleanToken);

      if (error || !data.user) {
        return null;
      }

      return data.user;
    } catch (err: any) {
      console.warn('[SupabaseService] Token verification warning:', err.message);
      return null;
    }
  }

  /**
   * Fetches user profile by user ID
   */
  public async getProfile(userId: string): Promise<UserProfile | null> {
    if (!this.client || !userId) return null;

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        username: data.username || `user_${data.id.slice(0, 6)}`,
        displayName: data.display_name || data.username || 'Anonymous',
        avatarUrl: data.avatar_url,
        createdAt: data.created_at || new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn('[SupabaseService] getProfile warning:', err.message);
      return null;
    }
  }

  /**
   * Upserts a user profile into the profiles table
   */
  public async upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
    if (!this.client || !profile.id) return;

    try {
      const { error } = await this.client.from('profiles').upsert(
        {
          id: profile.id,
          username: profile.username,
          display_name: profile.displayName,
          avatar_url: profile.avatarUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        console.warn('[SupabaseService] upsertProfile DB notice:', error.message);
      }
    } catch (err: any) {
      console.warn('[SupabaseService] upsertProfile error:', err.message);
    }
  }

  /**
   * Records a room session in persistent Supabase history
   */
  public async recordRoomSession(params: {
    roomId: string;
    roomName: string;
    hostId: string;
    hostName: string;
    category?: string;
  }): Promise<void> {
    if (!this.client) return;

    try {
      const { error } = await this.client.from('room_history').insert({
        room_id: params.roomId,
        room_name: params.roomName,
        host_id: params.hostId,
        host_name: params.hostName,
        category: params.category || 'music',
        created_at: new Date().toISOString(),
      });

      if (error) {
        // Table may not yet be created in user's instance; log gracefully
        console.log(`[SupabaseService] room_history notice: ${error.message}`);
      }
    } catch (err: any) {
      console.warn('[SupabaseService] recordRoomSession error:', err.message);
    }
  }

  /**
   * Quick health check against Supabase
   */
  public async healthCheck(): Promise<{ ok: boolean; message: string }> {
    if (!this.client) {
      return { ok: false, message: 'Supabase client not configured' };
    }

    try {
      // Light ping to Supabase auth API
      const { data, error } = await this.client.auth.getSession();
      return { ok: true, message: 'Supabase connected' };
    } catch (err: any) {
      return { ok: false, message: err.message || 'Supabase unreachable' };
    }
  }
}

export const supabaseService = new SupabaseService();
