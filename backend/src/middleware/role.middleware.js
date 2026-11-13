import { AppError } from '../utils/app-error.js';

export function requireRole(...allowedRoles) {
  return async function roleMiddleware(req, res, next) {
    try {
      if (!req.user?.id) {
        throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.');
      }

      // If mock dev user, fulfill role verification without network call
      if (req.user?.isMock) {
        req.profile = { role: req.user.role || 'rider', is_suspended: false };
        if (!allowedRoles.includes(req.profile.role)) {
          throw new AppError(403, 'INSUFFICIENT_ROLE', 'You do not have permission to perform this action.');
        }
        return next();
      }

      if (!req.supabase) {
        throw new AppError(401, 'AUTH_REQUIRED', 'Authentication is required.');
      }

      const { data: profile, error } = await req.supabase
        .from('profiles')
        .select('role,is_suspended')
        .eq('id', req.user.id)
        .maybeSingle();

      if (error) throw new AppError(503, 'PROFILE_LOOKUP_FAILED', 'Unable to verify account permissions.');
      if (!profile) throw new AppError(403, 'PROFILE_NOT_FOUND', 'Complete account setup before continuing.');
      if (profile.is_suspended) throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account is suspended.');
      if (!allowedRoles.includes(profile.role)) {
        throw new AppError(403, 'INSUFFICIENT_ROLE', 'You do not have permission to perform this action.');
      }

      req.profile = profile;
      next();
    } catch (error) {
      next(error);
    }
  };
}
