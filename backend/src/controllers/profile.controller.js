import { success } from '../utils/api-response.js';
import { getOwnProfile, updateOwnProfile } from '../services/profile.service.js';

export async function getProfile(req, res) {
  const profile = await getOwnProfile(req.supabase, req.user.id);
  return success(res, { profile });
}

export async function patchProfile(req, res) {
  const profile = await updateOwnProfile(req.supabase, req.user.id, req.body);
  return success(res, { profile });
}
