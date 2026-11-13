import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional().nullable(),
  avatarUrl: z.string().url().max(2048).optional().nullable()
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'Provide at least one field to update.'
});
