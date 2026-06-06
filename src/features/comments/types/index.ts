import { z } from 'zod';

export const commentSchema = z.object({
  user: z.string().min(1, 'Name/Alias is required'),
  text: z.string().min(1, 'Comment text cannot be empty')
});

export type CommentInput = z.infer<typeof commentSchema>;
export default commentSchema;
