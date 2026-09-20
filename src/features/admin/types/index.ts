import { z } from 'zod';

export const novelFormSchema = z.object({
  title: z.string().min(1, 'Main title is required'),
  alternativeTitle: z.string().min(1, 'Alternative title is required'),
  author: z.string().min(1, 'Original author is required'),
  translator: z.string().min(1, 'Translator is required'),
  genres: z.string().min(1, 'Main genre is required'),
  synopsis: z.string().min(1, 'Synopsis is required')
});

export const chapterFormSchema = z.object({
  novelId: z.string().min(1, 'Select target novel'),
  title: z.string().min(1, 'Chapter title is required'),
  content: z.string().min(1, 'Chapter content is required')
});

export type NovelFormInput = z.infer<typeof novelFormSchema>;
export type ChapterFormInput = z.infer<typeof chapterFormSchema>;
