import { createUserSupabaseClient, supabasePublic } from '../config/supabase.js';
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.get('authorization') ?? '';
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new AppError(401, 'AUTH_REQUIRED', 'A valid bearer token is required.');

    const accessToken = match[1].trim();
    if (!accessToken) throw new AppError(401, 'AUTH_REQUIRED', 'A valid bearer token is required.');

    // Hackathon development & demo fallback
    const isDevToken = accessToken.startsWith('demo-') || accessToken.startsWith('dev-') || accessToken === 'test-token';
    const isPlaceholderSupabase = !env.supabaseConfigured || env.SUPABASE_URL.includes('placeholder');
    
    if (isDevToken || (isPlaceholderSupabase && env.NODE_ENV !== 'production')) {
      const role = accessToken.includes('captain') ? 'captain' : accessToken.includes('admin') ? 'admin' : 'rider';
      req.user = { 
        id: '00000000-0000-0000-0000-000000000001', 
        email: 'demo@mysawari.local', 
        role, 
        isMock: true 
      };
      req.supabase = supabasePublic ? createUserSupabaseClient(accessToken) : null;
      return next();
    }

    const userClient = createUserSupabaseClient(accessToken);
    const { data, error } = await userClient.auth.getUser(accessToken);
    if (error || !data?.user) {
      if (env.NODE_ENV === 'development') {
        req.user = { 
          id: '00000000-0000-0000-0000-000000000001', 
          email: 'dev@mysawari.local', 
          role: 'rider', 
          isMock: true 
        };
        req.supabase = userClient;
        return next();
      }
      throw new AppError(401, 'INVALID_TOKEN', 'Your session is invalid or has expired.');
    }

    req.user = { id: data.user.id, email: data.user.email ?? null, role: data.user.user_metadata?.role || 'rider' };
    req.supabase = userClient;
    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuth(req, res, next) {
  const authorization = req.get('authorization') ?? '';
  if (!authorization) {
    req.user = null;
    req.supabase = null;
    return next();
  }
  return requireAuth(req, res, next);
}
