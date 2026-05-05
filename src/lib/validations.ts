import { z } from 'zod';

// ─── Post Schemas ─────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters.')
    .max(200, 'Title must be 200 characters or less.')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.')
    .trim(),
  mainImage: z.string().url('mainImage must be a valid URL.').optional().or(z.literal('')),
  tags: z
    .array(z.string().toLowerCase().trim())
    .max(10, 'You can add a maximum of 10 tags.')
    .default([]),
  status: z.enum(['Draft', 'Published']).default('Draft'),
});

export const updatePostSchema = createPostSchema.partial().extend({
  status: z.enum(['Draft', 'Published', 'Trash']).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
