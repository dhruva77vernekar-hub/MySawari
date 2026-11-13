import { AppError } from '../utils/app-error.js';

export async function getOwnProfile(userClient, userId) {
  const { data, error } = await userClient
    .from('profiles')
    .select('id,full_name,phone,avatar_url,role,is_suspended,created_at,updated_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new AppError(503, 'PROFILE_READ_FAILED', 'Unable to load your profile.');
  if (!data) throw new AppError(404, 'PROFILE_NOT_FOUND', 'Profile not found.');
  return data;
}

export async function updateOwnProfile(userClient, userId, input) {
  const updates = {};
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.phone !== undefined) updates.phone = input.phone;
  if (input.avatarUrl !== undefined) updates.avatar_url = input.avatarUrl;

  const { data, error } = await userClient
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id,full_name,phone,avatar_url,role,is_suspended,created_at,updated_at')
    .single();

  if (error) {
    if (error.code === '23505') throw new AppError(409, 'PHONE_ALREADY_USED', 'This phone number is already in use.');
    if (error.code === '42501') throw new AppError(403, 'PROFILE_UPDATE_FORBIDDEN', 'One or more profile fields cannot be changed.');
    throw new AppError(503, 'PROFILE_UPDATE_FAILED', 'Unable to update your profile.');
  }
  return data;
}
