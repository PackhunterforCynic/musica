import { Request, Response, NextFunction } from 'express';
import { supabaseService } from '../services/SupabaseService';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  };
}

/**
 * Optional authentication middleware:
 * Extracts user if valid Bearer token provided, but allows unauthenticated guest requests to proceed.
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7).trim();
  const user = await supabaseService.verifyToken(token);
  if (user) {
    req.user = user;
  }
  next();
}

/**
 * Required authentication middleware:
 * Rejects requests with 401 if valid Supabase token is not present.
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authorization header with Bearer token is required.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const user = await supabaseService.verifyToken(token);
  if (!user) {
    res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
    return;
  }

  req.user = user;
  next();
}
